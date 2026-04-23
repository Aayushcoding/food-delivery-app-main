import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit, OnDestroy {

  restaurantName = '';
  orders: any[] = [];
  loading = true;
  errorMessage = '';
  toastMessage = '';
  toastError = false;
  updatingId: string | null = null;   // tracks which order is currently being updated
  private toastTimer: any;
  private pollTimer:  any;

  // Owner-settable statuses — out_for_delivery and beyond are agent-controlled
  readonly agentStatuses = ['out_for_delivery', 'picked_up', 'on_the_way', 'arriving', 'delivered'];

  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const owner = this.authService.getUser();
    if (!owner) { this.router.navigate(['/login']); return; }

    // 1. Try router navigation state
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;

    let restaurantId: string | null = null;

    if (state?.restaurantId) {
      restaurantId = state.restaurantId;
      this.restaurantName = state.restaurantName || '';
      sessionStorage.setItem('ownerRestaurantId', restaurantId!);
      sessionStorage.setItem('ownerRestaurantName', this.restaurantName);
    } else {
      // 2. Fallback: sessionStorage (after page refresh)
      restaurantId = sessionStorage.getItem('ownerRestaurantId');
      this.restaurantName = sessionStorage.getItem('ownerRestaurantName') || '';
    }

    if (restaurantId) {
      this.loadOrders(restaurantId);
      // Poll every 20 s so new incoming orders appear automatically
      this.pollTimer = setInterval(() => this.loadOrders(restaurantId!), 20000);
    } else {
      // 3. Last resort: use first restaurant from API
      this.customerService.getRestaurantByOwner(owner.id).subscribe({
        next: (res) => {
          const list: any[] = res.success ? (res.data || []) : [];
          if (list.length > 0) {
            restaurantId = list[0].restaurantId;
            this.restaurantName = list[0].restaurantName;
            this.loadOrders(restaurantId!);
            this.pollTimer = setInterval(() => this.loadOrders(restaurantId!), 20000);
          } else {
            this.errorMessage = 'No restaurant found.';
            this.loading = false;
          }
        },
        error: () => { this.errorMessage = 'Failed to load restaurant.'; this.loading = false; }
      });
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.pollTimer);
    clearTimeout(this.toastTimer);
  }

  loadOrders(restaurantId: string): void {
    this.customerService.getOrdersByRestaurant(restaurantId).subscribe({
      next: (res) => {
        const rawOrders: any[] = res.success ? (res.data || []) : [];
        this.orders = rawOrders.map(order => ({
          ...order,
          enrichedItems: (order.items || []).map((item: any) => ({
            ...item,
            itemName: item.name || item.itemId
          }))
        }));
        this.loading = false;
      },
      error: () => { this.errorMessage = 'Failed to load orders.'; this.loading = false; }
    });
  }

  /** True when a delivery agent has been assigned — owner's job is done */
  isAssigned(order: any): boolean {
    return !!(order.deliveryAgentId) || this.agentStatuses.includes(order.status);
  }


  setStatus(order: any, status: string): void {
    if (this.agentStatuses.includes(status)) {
      this.showToast('⛔ Only delivery agents can set that status.', true);
      return;
    }
    if (status === 'cancelled' && !confirm('Cancel this order?')) return;

    this.updatingId = order.id;
    this.customerService.updateOrderStatus(order.id, status).subscribe({
      next: (res) => {
        this.updatingId = null;
        if (res.success) {
          order.status = status;
          const msgs: Record<string, string> = {
            confirmed: '✅ Order confirmed! Agent can now see it.',
            preparing: '👨‍🍳 Marked as preparing. Waiting for a delivery agent.',
            cancelled: '🔴 Order cancelled.'
          };
          this.showToast(msgs[status] || '✅ Status updated!', false);
        }
      },
      error: (err) => {
        this.updatingId = null;
        this.showToast(err?.error?.message || 'Failed to update status.', true);
      }
    });
  }

  /** Only count delivered orders — cancelled/pending/etc do not generate earnings */
  get totalEarnings(): number {
    return this.orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.finalAmount != null ? o.finalAmount : (o.totalAmount || 0)), 0);
  }


  showToast(msg: string, isError: boolean): void {
    this.toastMessage = msg;
    this.toastError = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 3000);
  }

  goBack(): void { this.router.navigate(['/restaurant']); }
}