import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../shared/models/index';

@Component({
  selector: 'app-deliveries',
  templateUrl: './deliveries.component.html',
  styleUrls: ['./deliveries.component.css']
})
export class DeliveriesComponent implements OnInit {

  deliveries: Order[] = [];
  loading = true;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadDeliveries();
  }

  loadDeliveries(): void {
    this.apiService.getOrders().subscribe(
      (data) => {
        this.deliveries = data.filter(o => o.status !== 'Delivered');
        this.loading = false;
      },
      (error) => {
        console.error('Error loading deliveries:', error);
        this.loading = false;
      }
    );
  }

  updateDeliveryStatus(orderId: string, newStatus: string): void {
    const delivery = this.deliveries.find(d => d.orderId === orderId);
    if (delivery) {
      delivery.status = newStatus as any;
      alert(`Delivery status updated to ${newStatus}`);
    }
  }

  getStatusClass(status: string): string {
    return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
  }
}