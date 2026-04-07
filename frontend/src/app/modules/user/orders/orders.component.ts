import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../shared/models/index';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {

  orders: Order[] = [];
  loading = true;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const userData = localStorage.getItem('user');
    const userId = userData ? JSON.parse(userData).id : undefined;

    this.apiService.getOrders(userId).subscribe(
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

  getStatusClass(status: string): string {
    return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
  }
}