import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
selector:'app-customer-orders',
templateUrl:'./customer-orders.component.html',
styleUrls:['./customer-orders.component.css']
})
export class CustomerOrdersComponent implements OnInit{

orders: any[] = [];
loading: boolean = false;
errorMessage: string = '';

constructor(
  private orderService: OrderService,
  private authService: AuthService,
  private router: Router
){}

ngOnInit(): void {
  this.loadOrders();
}

loadOrders(): void {
  const user = this.authService.getUser();
  if (!user) {
    this.router.navigate(['/login']);
    return;
  }

  this.loading = true;
  this.errorMessage = '';

  this.orderService.getUserOrders(user.id).subscribe({
    next: (res) => {
      this.loading = false;
      if (res.success) {
        this.orders = res.data || [];
      } else {
        this.errorMessage = res.message || 'Could not load orders.';
      }
    },
    error: (err) => {
      this.loading = false;
      this.errorMessage = err?.error?.message || 'Failed to load orders. Please try again.';
      console.error('Error loading orders:', err);
    }
  });
}

goHome(){
  this.router.navigate(['/customer/customer-home']);
}

}