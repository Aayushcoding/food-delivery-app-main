import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService }    from '../../core/services/order.service';
import { AuthService }     from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { ReviewService }   from '../../core/services/review.service';

@Component({
  selector:    'app-customer-orders',
  templateUrl: './customer-orders.component.html',
  styleUrls:   ['./customer-orders.component.css']
})
export class CustomerOrdersComponent implements OnInit, OnDestroy {

  orders:       any[]    = [];
  loading:      boolean  = false;
  errorMessage: string   = '';
  cancellingId: string   = '';
  toastMessage: string   = '';
  toastError:   boolean  = false;
  /** restaurantId → restaurantName lookup */
  restaurantNames: Record<string, string> = {};
  /** orderId → { restaurant: {...}, agent: {...} } */
  contactInfo: Record<string, any> = {};
  private toastTimer: any;
  private pollTimer:  any;

  // ── Review modal state ──────────────────────────────────
  reviewModalOpen   = false;
  reviewOrder:      any    = null;
  reviewRating      = 0;
  reviewComment     = '';
  reviewSubmitting  = false;
  reviewedOrderIds: Set<string> = new Set();

  // ── Delivery timeline steps ─────────────────────────────
  readonly deliverySteps = [
    { status: 'out_for_delivery', label: 'Agent Assigned', icon: '🛵' },
    { status: 'picked_up',        label: 'Picked Up',     icon: '📦' },
    { status: 'on_the_way',       label: 'On the Way',    icon: '🛵' },
    { status: 'arriving',         label: 'Arriving',      icon: '📍' },
    { status: 'delivered',        label: 'Delivered',     icon: '🎉' }
  ];

  constructor(
    private orderService:    OrderService,
    private authService:     AuthService,
    private customerService: CustomerService,
    private reviewService:   ReviewService,
    private router:          Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    // Poll every 30 s — re-fetch from API so live status changes appear
    this.pollTimer = setInterval(() => this.loadOrders(), 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollTimer);
    clearTimeout(this.toastTimer);
  }

  // ── Orders ──────────────────────────────────────────────

  loadOrders(): void {
    const user = this.authService.getUser();
    if (!user) { this.router.navigate(['/auth']); return; }

    this.loading      = true;
    this.errorMessage = '';

    this.orderService.getUserOrders(user.id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.orders = res.data || [];
          this.orders
            .filter(o => o.status === 'delivered')
            .forEach(o => this.checkReviewed(o.id));
          // Enrich with restaurant names and contact info
          this.loadRestaurantNames();
          this.loadContactInfo();
        } else {
          this.errorMessage = res.message || 'Could not load orders.';
        }
      },
      error: (err) => {
        this.loading      = false;
        this.errorMessage = err?.error?.message || 'Failed to load orders. Please try again.';
      }
    });
  }

  /** Fetch all restaurants once and build an id→name map */
  private loadRestaurantNames(): void {
    const missingIds = [...new Set(
      this.orders.map(o => o.restaurantId).filter(id => id && !this.restaurantNames[id])
    )];
    if (missingIds.length === 0) return;

    this.customerService.getRestaurants().subscribe({
      next: (res) => {
        const list: any[] = res.success ? (res.data || []) : [];
        list.forEach((r: any) => {
          if (r.restaurantId && r.restaurantName) {
            this.restaurantNames[r.restaurantId] = r.restaurantName;
          }
        });
      },
      error: () => {} // silently ignore — fall back to restaurantId
    });
  }

  /** Fetch contact info (restaurant phone + agent phone) for each order */
  private loadContactInfo(): void {
    this.orders.forEach(order => {
      if (this.contactInfo[order.id]) return; // already loaded
      this.customerService.getOrderContactInfo(order.id).subscribe({
        next: (res: any) => {
          if (res.success) this.contactInfo[order.id] = res.data;
        },
        error: () => {}
      });
    });
  }

  checkReviewed(orderId: string): void {
    this.reviewService.getReviewByOrder(orderId).subscribe({
      next: (res) => { if (res.data) this.reviewedOrderIds.add(orderId); },
      error: () => {}
    });
  }

  // ── Delivery timeline helpers ────────────────────────────

  isInDelivery(order: any): boolean {
    return ['out_for_delivery', 'picked_up', 'on_the_way', 'arriving', 'delivered'].includes(order.status);
  }

  /** True when the order is in the pool but no agent has accepted yet */
  isSearching(order: any): boolean {
    return order.status === 'out_for_delivery' && !order.deliveryAgentId;
  }

  stepIndex(status: string): number {
    return this.deliverySteps.findIndex(s => s.status === status);
  }

  stepState(order: any, step: any): 'done' | 'current' | 'pending' {
    const cur = this.stepIndex(order.status);
    const si  = this.stepIndex(step.status);
    if (si < cur)   return 'done';
    if (si === cur) return 'current';
    return 'pending';
  }

  // ── Cancel ──────────────────────────────────────────────

  canCancel(order: any): boolean {
    if (!['pending', 'confirmed'].includes(order.status)) return false;
    return (Date.now() - new Date(order.createdAt).getTime()) <= 5 * 60 * 1000;
  }

  minutesLeft(order: any): number {
    const elapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
    return Math.max(0, Math.ceil(5 - elapsed));
  }

  cancelOrder(order: any): void {
    if (this.cancellingId || !this.canCancel(order)) return;
    if (!confirm('Cancel this order?')) return;

    this.cancellingId = order.id;
    this.orderService.cancelOrder(order.id).subscribe({
      next: (res) => {
        this.cancellingId = '';
        if (res.success) {
          order.status = 'cancelled';
          this.showToast('Order cancelled successfully.', false);
        } else {
          this.showToast(res.message || 'Could not cancel order.', true);
        }
      },
      error: (err) => {
        this.cancellingId = '';
        this.showToast(err?.error?.message || 'Failed to cancel order.', true);
      }
    });
  }

  // ── Review modal ─────────────────────────────────────────

  openReview(order: any): void {
    this.reviewOrder   = order;
    this.reviewRating  = 0;
    this.reviewComment = '';
    this.reviewModalOpen = true;
  }

  closeReview(): void {
    this.reviewModalOpen = false;
    this.reviewOrder = null;
  }

  setRating(r: number): void { this.reviewRating = r; }

  submitReview(): void {
    if (!this.reviewRating) { this.showToast('Please select a star rating.', true); return; }
    this.reviewSubmitting = true;

    this.reviewService.submitReview(
      this.reviewOrder.id,
      this.reviewRating,
      this.reviewComment
    ).subscribe({
      next: () => {
        this.reviewSubmitting = false;
        this.reviewedOrderIds.add(this.reviewOrder.id);
        this.closeReview();
        this.showToast('⭐ Review submitted! Thank you.', false);
      },
      error: (err) => {
        this.reviewSubmitting = false;
        this.showToast(err?.error?.message || 'Could not submit review.', true);
      }
    });
  }

  // ── Invoice ──────────────────────────────────────────────

  viewInvoice(order: any): void {
    this.router.navigate(['/invoice', order.id]);
  }

  // ── Helpers ──────────────────────────────────────────────

  showToast(message: string, isError: boolean): void {
    this.toastMessage = message;
    this.toastError   = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 3500);
  }


  goHome(): void { this.router.navigate(['/customer/customer-home']); }

  /** Safely format deliveryAddress whether it is a string or an object */
  formatAddress(addr: any): string {
    if (!addr) return '—';
    if (typeof addr === 'string') return addr || '—';
    const parts = [addr.street, addr.city, addr.pincode, addr.landmark].filter(Boolean);
    return parts.join(', ') || '—';
  }

  /** Show finalAmount if set, otherwise fall back to totalAmount */
  displayAmount(order: any): number {
    return (order.finalAmount != null) ? order.finalAmount : (order.totalAmount || 0);
  }
}