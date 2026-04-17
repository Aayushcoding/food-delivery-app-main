import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {

  restaurantName = '';
  orders: any[] = [];
  loading = true;
  errorMessage = '';
  toastMessage = '';
  toastError = false;
  private toastTimer: any;

  // Owner can ONLY set these statuses — agent controls the rest
  readonly statuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'cancelled'];
  readonly agentStatuses = ['picked_up', 'on_the_way', 'arriving', 'delivered'];

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
    } else {
      // 3. Last resort: use first restaurant from API
      this.customerService.getRestaurantByOwner(owner.id).subscribe({
        next: (res) => {
          const list: any[] = res.success ? (res.data || []) : [];
          if (list.length > 0) {
            this.restaurantName = list[0].restaurantName;
            this.loadOrders(list[0].restaurantId);
          } else {
            this.errorMessage = 'No restaurant found.';
            this.loading = false;
          }
        },
        error: () => { this.errorMessage = 'Failed to load restaurant.'; this.loading = false; }
      });
    }
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

  updateStatus(order: any, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    if (this.agentStatuses.includes(status)) {
      this.showToast('⛔ Only delivery agents can set that status.', true);
      return;
    }
    this.customerService.updateOrderStatus(order.id, status).subscribe({
      next: (res) => {
        if (res.success) {
          order.status = status;
          this.showToast('✅ Status updated!', false);
        }
      },
      error: (err) => this.showToast(err?.error?.message || 'Failed to update status.', true)
    });
  }

  /** Only count delivered orders — cancelled/pending/etc do not generate earnings */
  get totalEarnings(): number {
    return this.orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }


  showToast(msg: string, isError: boolean): void {
    this.toastMessage = msg;
    this.toastError = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 3000);
  }

  goBack(): void { this.router.navigate(['/restaurant']); }
}