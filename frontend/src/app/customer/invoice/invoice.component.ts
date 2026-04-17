import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css']
})
export class InvoiceComponent implements OnInit {

  invoice: any = null;
  loading = true;
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (!orderId) { this.router.navigate(['/customer/orders']); return; }
    this.loadInvoice(orderId);
  }

  loadInvoice(orderId: string): void {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ 'x-auth-token': token });

    this.http.get<any>(`/api/orders/${orderId}/invoice`, { headers }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) this.invoice = res.data;
        else this.errorMsg = res.message || 'Could not load invoice.';
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Failed to load invoice. The order may not be delivered yet.';
      }
    });
  }

  get subtotal(): number {
    if (!this.invoice?.items) return 0;
    return this.invoice.items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
  }

  printInvoice(): void { window.print(); }

  goBack(): void { this.router.navigate(['/customer/orders']); }
}
