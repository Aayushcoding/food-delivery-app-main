import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../shared/models/index';

@Component({
  selector: 'app-manage-orders',
  templateUrl: './manage-orders.component.html',
  styleUrls: ['./manage-orders.component.css']
})
export class ManageOrdersComponent implements OnInit {

  orders: Order[] = [];
  loading = true;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.apiService.getOrders().subscribe(
      (data) => {
        this.orders = data;
        this.loading = false;
      },
      (error) => {
        console.error('Error loading orders:', error);
        this.loading = false;
      }
    );
  }

  updateOrderStatus(orderId: string, newStatus: string): void {
    const order = this.orders.find(o => o.orderId === orderId);
    if (order) {
      order.status = newStatus as any;
      alert(`Order status updated to ${newStatus}`);
    }
  }

  getStatusClass(status: string): string {
    return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
  }
}