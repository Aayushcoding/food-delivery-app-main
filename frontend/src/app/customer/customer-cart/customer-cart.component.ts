import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { MenuService } from '../../core/services/menu.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector:'app-customer-cart',
  templateUrl:'./customer-cart.component.html',
  styleUrls:['./customer-cart.component.css']
})
export class CustomerCartComponent implements OnInit {

  cartItems: any[] = [];       // enriched: { itemId, quantity, price, itemName, restaurantId }
  cartId: string = '';
  restaurantName: string = '';
  loading: boolean = false;
  cartLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService,
    private customerService: CustomerService,
    private menuService: MenuService
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.cartLoading = true;
    this.errorMessage = '';

    this.customerService.getCart(user.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cartId = res.data.id;
          const rawItems: any[] = res.data.items || [];

          if (rawItems.length === 0) {
            this.cartLoading = false;
            this.cartItems = [];
            return;
          }

          // Enrich items with itemName from menu API
          const lookups = rawItems.map(item =>
            this.menuService.getMenuItem(item.itemId).pipe(
              map(menuRes => ({
                ...item,
                itemName: menuRes?.data?.itemName || item.itemId,
                description: menuRes?.data?.description || '',
                imageUrl: menuRes?.data?.imageUrl || ''
              })),
              catchError(() => of({ ...item, itemName: item.itemId }))
            )
          );

          forkJoin(lookups).subscribe(enriched => {
            this.cartItems = enriched;
            this.cartLoading = false;

            // Load restaurant name from first item
            if (res.data.restaurantId) {
              this.customerService.getRestaurantById(res.data.restaurantId).subscribe({
                next: r => { if (r.success) this.restaurantName = r.data.restaurantName; },
                error: () => {}
              });
            }
          });

        } else {
          this.cartItems = [];
          this.cartLoading = false;
        }
      },
      error: (err) => {
        this.cartLoading = false;
        if (err.status === 404) {
          this.cartItems = []; // empty cart — valid
        } else {
          this.errorMessage = 'Failed to load cart. Please refresh.';
          console.error('Error loading cart:', err);
        }
      }
    });
  }

  // Total: price × quantity for each item
  get total(): number {
    return this.cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
  }

  get itemCount(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  remove(index: number): void {
    const item = this.cartItems[index];
    if (!this.cartId || !item?.itemId) return;

    this.customerService.removeFromCart(this.cartId, item.itemId).subscribe({
      next: (res) => {
        if (res.success) {
          // Re-load to sync with backend
          this.loadCart();
        }
      },
      error: (err) => {
        console.error('Error removing item:', err);
        this.errorMessage = err?.error?.message || 'Could not remove item.';
      }
    });
  }

  continueShoppingOldStyle(): void {
    this.router.navigate(['/customer/customer-home']);
  }

  placeOrder(): void {
    if (this.cartItems.length === 0) return;

    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Backend will use stored address or a default — we can optionally send one
    const orderData = { userId: user.id };

    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.cartItems = [];
          this.cartId = '';
          this.router.navigate(['/customer/success'], {
            state: { orderId: response.data?.id || 'Placed' }
          });
        } else {
          this.errorMessage = 'Failed to place order: ' + (response.message || 'Unknown error');
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Error placing order. Please try again.';
        console.error('Order error:', err);
      }
    });
  }
}
