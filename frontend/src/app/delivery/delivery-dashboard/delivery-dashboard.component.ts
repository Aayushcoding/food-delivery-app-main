import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { DeliveryService, AgentOrderStatus } from 'src/app/core/services/delivery.service';

// Sequential delivery steps that an agent advances through
const DELIVERY_STEPS: AgentOrderStatus[] = ['picked_up', 'on_the_way', 'arriving', 'delivered'];

@Component({
  selector: 'app-delivery-dashboard',
  templateUrl: './delivery-dashboard.component.html',
  styleUrls: ['./delivery-dashboard.component.css']
})
export class DeliveryDashboardComponent implements OnInit, OnDestroy {

  agent: any = null;
  availableOrders: any[] = [];
  activeOrders:    any[] = [];
  activeTab: 'available' | 'active' = 'available';

  isLoading    = false;
  actionLoading: { [orderId: string]: boolean } = {};
  toastMsg   = '';
  toastError = false;
  private toastTimer: any;
  private refreshTimer: any;

  constructor(
    private authService: AuthService,
    private deliveryService: DeliveryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.agent = this.authService.getUser();
    if (!this.agent || !['DeliveryAgent', 'Delivery'].includes(this.agent.role)) {
      this.router.navigate(['/']);
      return;
    }
    this.loadAvailableOrders();
    // Auto-refresh every 30s so new orders appear and timeouts clear
    this.refreshTimer = setInterval(() => {
      if (this.activeTab === 'available') this.loadAvailableOrders();
      else this.loadActiveOrders();
    }, 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshTimer);
    clearTimeout(this.toastTimer);
  }

  // ── Data loaders ──────────────────────────────────────────────────────────

  loadAvailableOrders(): void {
    this.isLoading = true;
    this.deliveryService.getAvailableOrders().subscribe({
      next: (res) => {
        this.availableOrders = res.data || [];
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Could not load available orders. Is the backend running?', true);
        this.isLoading = false;
      }
    });
  }

  loadActiveOrders(): void {
    this.isLoading = true;
    const agentId = this.agent?.id;
    if (!agentId) { this.isLoading = false; return; }

    this.deliveryService.getMyActiveOrders(agentId).subscribe({
      next: (res) => {
        this.activeOrders = res.data || [];
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Could not load active deliveries.', true);
        this.isLoading = false;
      }
    });
  }

  switchTab(tab: 'available' | 'active'): void {
    this.activeTab = tab;
    if (tab === 'available') this.loadAvailableOrders();
    else                     this.loadActiveOrders();
  }

  // ── Accept / Reject ───────────────────────────────────────────────────────

  acceptOrder(order: any): void {
    const agentId = this.agent?.id;
    if (!agentId) { this.showToast('Agent ID not found. Please log in again.', true); return; }

    this.actionLoading[order.id] = true;
    this.deliveryService.assignOrder(order.id, agentId).subscribe({
      next: (res) => {
        this.actionLoading[order.id] = false;
        this.showToast(`✅ Order #${order.id} accepted — pick it up within 30 minutes!`, false);
        // Move to active tab
        this.availableOrders = this.availableOrders.filter(o => o.id !== order.id);
        const accepted = { ...order, deliveryAgentId: agentId, acceptedAt: new Date().toISOString() };
        this.activeOrders.push(accepted);
        this.switchTab('active');
      },
      error: (err) => {
        this.actionLoading[order.id] = false;
        this.showToast(err?.error?.message || 'Could not accept order.', true);
      }
    });
  }

  rejectOrder(order: any): void {
    const agentId = this.agent?.id;
    if (!agentId) return;

    this.actionLoading[order.id] = true;
    this.deliveryService.rejectOrder(order.id, agentId).subscribe({
      next: () => {
        this.actionLoading[order.id] = false;
        this.showToast(`Order #${order.id} skipped.`, false);
        this.availableOrders = this.availableOrders.filter(o => o.id !== order.id);
      },
      error: (err) => {
        this.actionLoading[order.id] = false;
        this.showToast(err?.error?.message || 'Could not skip order.', true);
      }
    });
  }

  // ── Delivery step progression ─────────────────────────────────────────────

  /** Returns the NEXT step label for a given order status */
  nextStep(status: string): AgentOrderStatus | null {
    const idx = DELIVERY_STEPS.indexOf(status as AgentOrderStatus);
    // If status is out_for_delivery, next is picked_up (idx 0)
    if (status === 'out_for_delivery') return 'picked_up';
    if (idx >= 0 && idx < DELIVERY_STEPS.length - 1) return DELIVERY_STEPS[idx + 1];
    return null; // already delivered
  }

  nextStepLabel(status: string): string {
    const next = this.nextStep(status);
    if (!next) return '';
    const labels: { [k: string]: string } = {
      picked_up:   '📦 Mark Picked Up',
      on_the_way:  '🛵 On the Way',
      arriving:    '📍 Arriving Now',
      delivered:   '✅ Mark Delivered'
    };
    return labels[next] || next;
  }

  advanceStatus(order: any): void {
    const agentId = this.agent?.id;
    const next = this.nextStep(order.status);
    if (!agentId || !next) return;

    this.actionLoading[order.id] = true;
    this.deliveryService.updateOrderStatus(agentId, order.id, next).subscribe({
      next: () => {
        this.actionLoading[order.id] = false;
        order.status = next;
        if (next === 'delivered') {
          this.showToast(`🎉 Order #${order.id} delivered! Great work!`, false);
          setTimeout(() => {
            this.activeOrders = this.activeOrders.filter(o => o.id !== order.id);
          }, 2000);
        } else {
          this.showToast(`Status updated → ${this.formatStatus(next)}`, false);
        }
      },
      error: (err) => {
        this.actionLoading[order.id] = false;
        this.showToast(err?.error?.message || 'Could not update status.', true);
      }
    });
  }

  // ── Pickup timer helpers ──────────────────────────────────────────────────

  /** Minutes remaining in the 30-min pickup window */
  pickupMinsLeft(order: any): number {
    if (!order.acceptedAt) return 30;
    const elapsed = (Date.now() - new Date(order.acceptedAt).getTime()) / (1000 * 60);
    return Math.max(0, Math.ceil(30 - elapsed));
  }

  pickupUrgent(order: any): boolean {
    return this.pickupMinsLeft(order) <= 5;
  }

  // ── Status step indicators ────────────────────────────────────────────────

  get deliverySteps() { return DELIVERY_STEPS; }

  stepDone(order: any, step: string): boolean {
    const orderIdx = DELIVERY_STEPS.indexOf(order.status as AgentOrderStatus);
    const stepIdx  = DELIVERY_STEPS.indexOf(step as AgentOrderStatus);
    return stepIdx <= orderIdx;
  }

  stepActive(order: any, step: string): boolean {
    return order.status === step;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatStatus(s: string): string {
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  statusClass(s: string): string {
    const map: { [k: string]: string } = {
      delivered:       'badge-green',
      arriving:        'badge-green',
      on_the_way:      'badge-orange',
      picked_up:       'badge-orange',
      out_for_delivery:'badge-yellow',
      preparing:       'badge-yellow',
    };
    return map[s] || 'badge-blue';
  }

  get agentGreeting(): string {
    return this.agent?.username ? `Hi, ${this.agent.username}! 👋` : 'Delivery Dashboard';
  }

  showToast(msg: string, isError: boolean): void {
    this.toastMsg   = msg;
    this.toastError = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMsg = '', 3500);
  }

  goHome(): void {
    this.router.navigate(['/agent/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
