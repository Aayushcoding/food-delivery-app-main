import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {

  owner: any = null;
  restaurant: any = null;
  orders: any[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.owner = this.authService.getUser();
    if (!this.owner) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadRestaurant();
  }

  loadRestaurant(): void {
    this.loading = true;
    this.customerService.getRestaurantByOwner(this.owner.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.restaurant = res.data;
          this.loadOrders(this.restaurant.restaurantId);
        } else {
          this.errorMessage = 'No restaurant found for your account.';
          this.loading = false;
        }
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Could not load restaurant.';
        this.loading = false;
      }
    });
  }

  loadOrders(restaurantId: string): void {
    this.customerService.getOrdersByRestaurant(restaurantId).subscribe({
      next: (res) => {
        this.orders = res.success ? (res.data || []) : [];
        this.loading = false;
      },
      error: () => {
        this.orders = [];
        this.loading = false;
      }
    });
  }

  get totalOrders(): number {
    return this.orders.length;
  }

  get totalEarnings(): number {
    return this.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }

  get pendingOrders(): number {
    return this.orders.filter(o => o.status === 'pending' || o.status === 'Pending').length;
  }

  goToMenu(): void {
    this.router.navigate(['/owner/menu']);
  }

  goToOrders(): void {
    this.router.navigate(['/owner/orders']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}