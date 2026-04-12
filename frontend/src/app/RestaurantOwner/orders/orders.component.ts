import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { MenuService } from '../../core/services/menu.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {

  orders: any[] = [];
  loading = true;
  errorMessage = '';
  toastMessage = '';
  toastError = false;
  private toastTimer: any;

  readonly statuses = ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'];

  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private menuService: MenuService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const owner = this.authService.getUser();
    if (!owner) { this.router.navigate(['/login']); return; }

    this.customerService.getRestaurantByOwner(owner.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.loadOrders(res.data.restaurantId);
        } else {
          this.errorMessage = 'No restaurant found.';
          this.loading = false;
        }
      },
      error: () => { this.errorMessage = 'Failed to load restaurant.'; this.loading = false; }
    });
  }

  loadOrders(restaurantId: string): void {
    this.customerService.getOrdersByRestaurant(restaurantId).subscribe({
      next: (res) => {
        const rawOrders: any[] = res.success ? (res.data || []) : [];

        if (rawOrders.length === 0) {
          this.orders = [];
          this.loading = false;
          return;
        }

        // Enrich each order's items with real menu item names
        const enriched$ = rawOrders.map(order => {
          if (!order.items || order.items.length === 0) {
            return of({ ...order, enrichedItems: [] });
          }
          const itemLookups = order.items.map((item: any) =>
            this.menuService.getMenuItem(item.itemId).pipe(
              map(r => ({ ...item, itemName: r?.data?.itemName || item.itemId })),
              catchError(() => of({ ...item, itemName: item.itemId }))
            )
          );
          return forkJoin(itemLookups).pipe(
            map(enrichedItems => ({ ...order, enrichedItems }))
          );
        });

        forkJoin(enriched$).subscribe({
          next: (result) => {
            this.orders = result;
            this.loading = false;
          },
          error: () => { this.orders = rawOrders; this.loading = false; }
        });
      },
      error: () => { this.errorMessage = 'Failed to load orders.'; this.loading = false; }
    });
  }

  updateStatus(order: any, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.customerService.updateOrderStatus(order.id, status).subscribe({
      next: (res) => {
        if (res.success) {
          order.status = status;
          this.showToast('✅ Status updated!', false);
        }
      },
      error: () => this.showToast('Failed to update status.', true)
    });
  }

  get totalEarnings(): number {
    return this.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }

  showToast(msg: string, isError: boolean): void {
    this.toastMessage = msg;
    this.toastError = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 3000);
  }

  goBack(): void { this.router.navigate(['/restaurant']); }
}