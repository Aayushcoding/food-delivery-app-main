import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { computeDiscount, CouponContext } from '../discounts/discounts.component';

@Component({
  selector:'app-customer-cart',
  templateUrl:'./customer-cart.component.html',
  styleUrls:['./customer-cart.component.css']
})
export class CustomerCartComponent implements OnInit {

  // Cart state
  cartItems:    any[]   = [];
  cartId:       string  = '';
  loading:      boolean = false;
  cartLoading:  boolean = false;
  errorMessage: string  = '';

  // Prevent double-tap per item
  inFlight: { [itemId: string]: boolean } = {};

  // ── Coupon ──────────────────────────────────────────────────────────
  couponCode:     string  = '';
  couponApplied:  boolean = false;
  couponMessage:  string  = '';
  couponError:    string  = '';
  discountAmount: number  = 0;

  private readonly baseUrl = '/api';

  constructor(
    private router:         Router,
    private http:           HttpClient,
    private orderService:   OrderService,
    private authService:    AuthService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.loadCart();
    // Pre-fill coupon if user copied one from Offers page
    const saved = localStorage.getItem('couponCode') || '';
    if (saved) this.couponCode = saved;
  }

  // ── CART LOAD ───────────────────────────────────────────────────────
  loadCart(): void {
    const user = this.authService.getUser();
    if (!user) { this.router.navigate(['/login']); return; }

    this.cartLoading  = true;
    this.errorMessage = '';

    this.customerService.getCart(user.id).subscribe({
      next: (res) => {
        this.cartLoading = false;
        if (res.success && res.data) {
          this.cartId = res.data.id;
          this.cartItems = (res.data.items || []).map((item: any) => ({
            ...item,
            itemName: item.name || item.itemName || item.itemId
          }));
          // Re-evaluate coupon against new subtotal
          if (this.couponCode) this.applyCoupon();
        } else {
          this.cartItems = [];
        }
      },
      error: (err) => {
        this.cartLoading = false;
        this.cartItems   = [];
        if (err.status !== 404) this.errorMessage = 'Failed to load cart. Please refresh.';
      }
    });
  }

  // ── LIVE TOTALS ─────────────────────────────────────────────────────
  /** Live subtotal computed directly from cart items (no stale backend value) */
  get subtotal(): number {
    return this.cartItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
  }

  get itemCount(): number {
    return this.cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
  }

  get finalTotal(): number {
    return Math.max(0, this.subtotal - this.discountAmount);
  }

  // ── COUPON LOGIC ────────────────────────────────────────────────────
  onCouponChange(): void {
    // Reset discount whenever user edits the coupon field
    this.couponApplied  = false;
    this.couponMessage  = '';
    this.couponError    = '';
    this.discountAmount = 0;
  }

  applyCoupon(): void {
    const code = this.couponCode.trim().toUpperCase();
    if (!code) return;

    // FIRST70 requires knowing if this is the user's first order — check order history
    if (code === 'FIRST70') {
      const user = this.authService.getUser();
      this.http.get<any>(`${this.baseUrl}/orders/user/${user?.id}`, {
        headers: this.authService.getAuthHeaders()
      }).subscribe({
        next: (res) => {
          const orders: any[] = res?.data || [];
          const deliveredCount = orders.filter((o: any) => o.status === 'delivered').length;
          const ctx: CouponContext = { isFirstOrder: deliveredCount === 0 };
          this._applyWithContext(code, ctx);
        },
        error: () => {
          // If unable to check, deny for safety
          this.couponApplied  = false;
          this.couponError    = '❌ Could not verify order history. Please try again.';
          this.discountAmount = 0;
        }
      });
    } else {
      this._applyWithContext(code, { isFirstOrder: false });
    }
  }

  private _applyWithContext(code: string, ctx: CouponContext): void {
    const result = computeDiscount(code, this.subtotal, ctx);
    if (result.valid) {
      this.couponApplied  = true;
      this.couponError    = '';
      this.discountAmount = result.discount;
      this.couponMessage  = result.message;
      localStorage.setItem('couponCode', code);
    } else {
      this.couponApplied  = false;
      this.couponError    = result.reason || 'Coupon not valid.';
      this.discountAmount = 0;
    }
  }

  removeCoupon(): void {
    this.couponCode     = '';
    this.couponApplied  = false;
    this.couponMessage  = '';
    this.couponError    = '';
    this.discountAmount = 0;
    localStorage.removeItem('couponCode');
  }

  // ── QUANTITY CONTROLS ───────────────────────────────────────────────
  increase(item: any): void {
    if (!this.cartId || this.inFlight[item.itemId]) return;
    this.inFlight = { ...this.inFlight, [item.itemId]: true };
    const newQty = (item.quantity || 1) + 1;

    this.customerService.updateCartItemQuantity(this.cartId, item.itemId, newQty).subscribe({
      next: (res) => {
        this.inFlight = { ...this.inFlight, [item.itemId]: false };
        if (res.success) {
          item.quantity = newQty;
          // Re-evaluate discount against new subtotal
          if (this.couponApplied) this.applyCoupon();
        }
      },
      error: () => { this.inFlight = { ...this.inFlight, [item.itemId]: false }; }
    });
  }

  decrease(item: any): void {
    if (!this.cartId || this.inFlight[item.itemId]) return;
    this.inFlight = { ...this.inFlight, [item.itemId]: true };

    if ((item.quantity || 1) <= 1) {
      this.customerService.removeFromCart(this.cartId, item.itemId).subscribe({
        next: (res) => {
          this.inFlight = { ...this.inFlight, [item.itemId]: false };
          if (res.success) {
            this.cartItems = this.cartItems.filter(i => i.itemId !== item.itemId);
            if (this.couponApplied) this.applyCoupon();
          }
        },
        error: () => { this.inFlight = { ...this.inFlight, [item.itemId]: false }; }
      });
    } else {
      const newQty = item.quantity - 1;
      this.customerService.updateCartItemQuantity(this.cartId, item.itemId, newQty).subscribe({
        next: (res) => {
          this.inFlight = { ...this.inFlight, [item.itemId]: false };
          if (res.success) {
            item.quantity = newQty;
            if (this.couponApplied) this.applyCoupon();
          }
        },
        error: () => { this.inFlight = { ...this.inFlight, [item.itemId]: false }; }
      });
    }
  }

  remove(item: any): void {
    if (!this.cartId || !item?.itemId) return;
    this.customerService.removeFromCart(this.cartId, item.itemId).subscribe({
      next: (res) => {
        if (res.success) {
          this.cartItems = this.cartItems.filter(i => i.itemId !== item.itemId);
          if (this.couponApplied) this.applyCoupon();
        }
      },
      error: (err) => { this.errorMessage = err?.error?.message || 'Could not remove item.'; }
    });
  }

  // ── NAVIGATION ──────────────────────────────────────────────────────
  goHome():    void { this.router.navigate(['/customer/customer-home']); }
  goToOffers(): void { this.router.navigate(['/customer/discounts']); }

  // ── PLACE ORDER ─────────────────────────────────────────────────────
  placeOrder(): void {
    if (this.cartItems.length === 0) return;
    const user = this.authService.getUser();
    if (!user) { this.router.navigate(['/login']); return; }

    this.loading      = true;
    this.errorMessage = '';

    this.http.get<any>(`${this.baseUrl}/users/${user.id}`, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (profileRes) => {
        const addresses: any[] = profileRes?.data?.addresses || [];
        const firstAddr = addresses[0];

        if (!firstAddr) {
          this.loading      = false;
          this.errorMessage = '📍 No delivery address saved. Please go to your Profile and add an address first.';
          return;
        }

        this.orderService.createOrder({
          userId:         user.id,
          addressId:      String(firstAddr._id),
          couponCode:     this.couponApplied ? this.couponCode.toUpperCase() : undefined,
          discountAmount: this.couponApplied ? this.discountAmount : 0,
          finalAmount:    this.finalTotal
        }).subscribe({
          next: (response) => {
            this.loading = false;
            if (response.success) {
              // Clear coupon after successful order
              localStorage.removeItem('couponCode');
              this.cartItems = [];
              this.cartId    = '';
              this.router.navigate(['/customer/success'], {
                state: { orderId: response.data?.id || 'Placed' }
              });
            } else {
              this.errorMessage = 'Failed to place order: ' + (response.message || 'Unknown error');
            }
          },
          error: (err) => {
            this.loading      = false;
            this.errorMessage = err?.error?.message || 'Error placing order. Please try again.';
          }
        });
      },
      error: () => {
        this.loading      = false;
        this.errorMessage = 'Could not fetch your profile. Please try again.';
      }
    });
  }
}
