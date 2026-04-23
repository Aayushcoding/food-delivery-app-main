import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/core/services/auth.service';

type DeliveryStep = 'picked_up' | 'on_the_way' | 'arriving' | 'delivered';
const STEPS: DeliveryStep[] = ['picked_up', 'on_the_way', 'arriving', 'delivered'];

@Component({
  selector: 'app-agent-dashboard',
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.css']
})
export class AgentDashboardComponent implements OnInit, OnDestroy {

  agent: any = null;
  activeTab: 'available' | 'active' | 'history' = 'available';

  availableOrders: any[] = [];
  activeOrders:    any[] = [];
  deliveryHistory: any[] = [];
  agentCities:     string[] = [];   // cities this agent delivers in (from profile)

  // ── Earnings ──────────────────────────────────────────────────
  totalEarnings    = 0;
  totalDeliveries  = 0;
  todayEarnings    = 0;
  todayDeliveries  = 0;

  loading = false;
  actionLoading: { [orderId: string]: boolean } = {};
  toast = { msg: '', error: false };

  private toastTimer:   any;
  private pollInterval: any;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.agent = this.authService.getUser();
    if (!this.agent || !['DeliveryAgent', 'Delivery'].includes(this.agent.role)) {
      this.router.navigate(['/']);
      return;
    }
    this.loadAvailable();
    this.loadEarnings();
    // Auto-refresh every 30 s to pick up new orders
    this.pollInterval = setInterval(() => this.load(), 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
    clearTimeout(this.toastTimer);
  }

  // ── Tab switching ─────────────────────────────────────────────────────────

  load(): void {
    if (this.activeTab === 'available') this.loadAvailable();
    else if (this.activeTab === 'active') this.loadActive();
    else this.loadHistory();
  }

  switchTab(tab: 'available' | 'active' | 'history'): void {
    this.activeTab = tab;
    this.load();
  }

  // ── Available orders ──────────────────────────────────────────────────────

  loadAvailable(): void {
    this.loading = true;
    this.http.get<any>('/api/agent/available-orders',
      { headers: this.authService.getAuthHeaders() }
    ).subscribe({
      next: res => {
        this.availableOrders = res.data || [];
        this.agentCities     = res.agentCities || [];
        this.loading = false;
      },
      error: () => { this.showToast('Could not load orders.', true); this.loading = false; }
    });
  }

  // ── My active deliveries ──────────────────────────────────────────────────

  loadActive(): void {
    this.loading = true;
    this.http.get<any>('/api/agent/my-orders',
      { headers: this.authService.getAuthHeaders() }
    ).subscribe({
      next: res => { this.activeOrders = res.data || []; this.loading = false; },
      error: ()  => { this.showToast('Could not load active orders.', true); this.loading = false; }
    });
  }

  // ── Delivery history tab ──────────────────────────────────────────────

  loadHistory(): void {
    this.loading = true;
    this.http.get<any>('/api/agent/history',
      { headers: this.authService.getAuthHeaders() }
    ).subscribe({
      next: res => { this.deliveryHistory = res.data || []; this.loading = false; },
      error: ()  => { this.showToast('Could not load history.', true); this.loading = false; }
    });
  }

  // ── Earnings ──────────────────────────────────────────────────────────────

  loadEarnings(): void {
    this.http.get<any>('/api/agent/earnings',
      { headers: this.authService.getAuthHeaders() }
    ).subscribe({
      next: res => {
        const d = res.data || {};
        this.totalEarnings   = d.totalEarnings   || 0;
        this.totalDeliveries = d.totalDeliveries || 0;
        this.todayEarnings   = d.todayEarnings   || 0;
        this.todayDeliveries = d.todayDeliveries || 0;
      },
      error: () => {} // silent — don't block the UI
    });
  }

  // ── Accept order ──────────────────────────────────────────────────────────

  accept(order: any): void {
    this.actionLoading[order.id] = true;
    this.http.post<any>(
      `/api/agent/accept/${order.id}`,
      {},
      { headers: this.authService.getAuthHeaders() }
    ).subscribe({
      next: res => {
        this.actionLoading[order.id] = false;
        this.showToast(`✅ Order #${order.id} accepted! Pick up within 30 min.`, false);
        this.availableOrders = this.availableOrders.filter(o => o.id !== order.id);
        // Reload active orders fresh from server so customerName etc. is populated
        this.activeTab = 'active';
        this.loadActive();
      },
      error: err => {
        this.actionLoading[order.id] = false;
        this.showToast(err?.error?.message || 'Could not accept order.', true);
      }
    });
  }

  // ── Advance delivery status ───────────────────────────────────────────────

  nextStep(status: string): DeliveryStep | null {
    if (status === 'out_for_delivery') return 'picked_up';
    const idx = STEPS.indexOf(status as DeliveryStep);
    if (idx >= 0 && idx < STEPS.length - 1) return STEPS[idx + 1];
    return null;
  }

  advance(order: any, step: DeliveryStep): void {
    this.actionLoading[order.id] = true;
    this.http.post<any>(
      `/api/agent/update-status/${order.id}`,
      { status: step },
      { headers: this.authService.getAuthHeaders() }
    ).subscribe({
      next: () => {
        this.actionLoading[order.id] = false;
        order.status = step;
        if (step === 'delivered') {
          this.showToast(`🎉 Order #${order.id} delivered! Well done!`, false);
          this.loadEarnings(); // refresh earnings immediately
          setTimeout(() => {
            this.activeOrders = this.activeOrders.filter(o => o.id !== order.id);
          }, 2000);
        } else {
          this.showToast(`Status updated → ${this.label(step)}`, false);
        }
      },
      error: err => {
        this.actionLoading[order.id] = false;
        this.showToast(err?.error?.message || 'Could not update status.', true);
      }
    });
  }

  // ── Stepper helpers ───────────────────────────────────────────────────────

  get steps() { return STEPS; }

  stepDone(order: any, step: string): boolean {
    const oi = STEPS.indexOf(order.status);
    const si = STEPS.indexOf(step as DeliveryStep);
    return si <= oi;
  }

  stepCurrent(order: any, step: string): boolean {
    return order.status === step;
  }

  // Pickup countdown (30-min window)
  minsLeft(order: any): number {
    const at = order.deliveryAcceptedAt || order.acceptedAt;
    if (!at) return 30;
    return Math.max(0, Math.ceil(30 - (Date.now() - new Date(at).getTime()) / 60000));
  }

  urgentPickup(order: any): boolean { return this.minsLeft(order) <= 5; }

  /** How much the agent will earn for this order: ₹30 flat + 5% of value */
  calcEarning(order: any): number {
    const amt = (order.finalAmount > 0 ? order.finalAmount : order.totalAmount) || 0;
    return Math.round(30 + amt * 0.05);
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  label(s: string): string {
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  statusColor(s: string): string {
    const m: Record<string, string> = {
      confirmed:        'yellow',
      preparing:        'purple',
      out_for_delivery: 'orange', picked_up: 'orange',
      on_the_way: 'blue', arriving: 'green', delivered: 'green'
    };
    return m[s] || 'gray';
  }

  itemList(order: any): string {
    return (order.items || [])
      .map((i: any) => `${i.name || i.itemName || i.itemId} ×${i.quantity}`)
      .join(', ');
  }

  /** Safely format deliveryAddress (object or string) */
  formatAddress(addr: any): string {
    if (!addr) return '—';
    if (typeof addr === 'string') return addr || '—';
    const parts = [addr.street, addr.city, addr.pincode, addr.landmark].filter(Boolean);
    return parts.join(', ') || '—';
  }

  showToast(msg: string, error: boolean): void {
    this.toast = { msg, error };
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.msg = '', 3500);
  }

  goHome(): void {
    this.router.navigate(['/agent/dashboard']);
  }

  goProfile(): void {
    this.router.navigate(['/agent/profile']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
