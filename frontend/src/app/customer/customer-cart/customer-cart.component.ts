import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OrderService }    from '../../core/services/order.service';
import { AuthService }     from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { computeDiscount, CouponContext } from '../discounts/discounts.component';

interface CartView {
  cartId:        string;
  restaurantId:  string;
  restaurantName: string;
  restaurantCity: string;   // actual city of restaurant
  cityMismatch:  boolean;   // true when restaurant city != selectedCity
  restaurantRating: number;
  restaurantReviewCount: number;
  items:         any[];
  paymentMethod: string;   // 'cod' | 'upi' | 'card' | 'netbanking'
  selectedAddressIdx: number;
  contactPhone:  string;   // editable per-cart
  // coupon state per cart
  couponCode:    string;
  couponApplied: boolean;
  couponMessage: string;
  couponError:   string;
  discountAmount: number;
  // ui state
  loading:       boolean;
  priceWarning:  string;
  errorMessage:  string;
  // batch order result
  orderPlaced:   boolean;
  placedOrderId: string;
}

@Component({
  selector:    'app-customer-cart',
  templateUrl: './customer-cart.component.html',
  styleUrls:   ['./customer-cart.component.css']
})
export class CustomerCartComponent implements OnInit {

  carts: CartView[] = [];
  activeIdx = 0;
  userAddresses: any[] = [];   // loaded once; shared across all carts

  // ── Inline address form state ────────────────────────────────────────
  showAddForm   = false;
  addrSaving    = false;
  addrError     = '';
  newStreet     = '';
  newLandmark   = '';
  newPincode    = '';
  deletingAddrId: string | null = null;

  cartLoading = false;
  inFlight: { [itemId: string]: boolean } = {};

  private readonly baseUrl = '/api';

  constructor(
    private router:          Router,
    private http:            HttpClient,
    private orderService:    OrderService,
    private authService:     AuthService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.loadAllCarts();
    this.loadUserAddresses();
    const saved = localStorage.getItem('couponCode') || '';
    if (saved && this.activeCart) this.activeCart.couponCode = saved;
  }

  get selectedCity(): string {
    return localStorage.getItem('selectedCity') || '';
  }

  get activeCart(): CartView | null {
    return this.carts[this.activeIdx] || null;
  }

  // ── LOAD ────────────────────────────────────────────────────────────
  loadAllCarts(): void {
    const user = this.authService.getUser();
    if (!user) { this.router.navigate(['/auth']); return; }

    this.cartLoading = true;
    this.customerService.getCartsByUser(user.id).subscribe({
      next: (res) => {
        this.cartLoading = false;
        const rawCarts: any[] = Array.isArray(res.data) ? res.data : [];
        // Filter out empty carts
        const nonEmpty = rawCarts.filter(c => c.items && c.items.length > 0);
        this.carts = nonEmpty.map(c => this.buildCartView(c));
        // Fetch restaurant names
        this.carts.forEach(cv => this.loadRestaurantName(cv));
        this.activeIdx = 0;
      },
      error: () => { this.cartLoading = false; }
    });
  }

  private buildCartView(raw: any): CartView {
    const user = this.authService.getUser();
    return {
      cartId:        raw.id,
      restaurantId:  raw.restaurantId,
      restaurantName: raw.restaurantId,
      restaurantCity: '',
      cityMismatch:  false,
      restaurantRating: 0,
      restaurantReviewCount: 0,
      items: (raw.items || []).map((item: any) => ({
        ...item,
        itemName: item.name || item.itemName || item.itemId
      })),
      paymentMethod: 'cod',
      selectedAddressIdx: 0,
      contactPhone:  user?.phoneNo || '',
      couponCode:    '',
      couponApplied: false,
      couponMessage: '',
      couponError:   '',
      discountAmount: 0,
      loading:       false,
      priceWarning:  '',
      errorMessage:  '',
      orderPlaced:   false,
      placedOrderId: ''
    };
  }

  // ── Load user addresses (once, shared) ───────────────────────────────
  loadUserAddresses(): void {
    const user = this.authService.getUser();
    if (!user) return;
    this.http.get<any>(`${this.baseUrl}/users/${user.id}`, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (res) => {
        this.userAddresses = res?.data?.addresses || [];
      },
      error: () => {}
    });
  }

  /** One-line label for an address (street + landmark, city hidden since it's fixed) */
  addressLabel(addr: any): string {
    if (!addr) return '—';
    const parts = [addr.street, addr.landmark].filter(Boolean);
    return parts.length ? parts.join(', ') : (addr.city || '—');
  }

  // ── INLINE ADD ADDRESS ───────────────────────────────────────────────
  openAddForm(): void {
    this.showAddForm = true;
    this.addrError   = '';
    this.newStreet   = '';
    this.newLandmark = '';
    this.newPincode  = '';
  }

  cancelAddForm(): void {
    this.showAddForm = false;
    this.addrError   = '';
  }

  saveNewAddress(): void {
    const street  = this.newStreet.trim();
    const pincode = this.newPincode.trim();
    const city    = (localStorage.getItem('selectedCity') || '').toLowerCase().trim();

    if (!street)  { this.addrError = 'Street / Area is required.'; return; }
    if (!city)    { this.addrError = 'No city selected — go back and set your city first.'; return; }
    if (pincode && !/^\d{6}$/.test(pincode)) { this.addrError = 'Pincode must be 6 digits.'; return; }

    const user = this.authService.getUser();
    if (!user) return;

    this.addrSaving = true;
    this.addrError  = '';
    this.http.post<any>(
      `${this.baseUrl}/users/${user.id}/addresses`,
      { street, city, pincode, landmark: this.newLandmark.trim() },
      { headers: this.authService.getAuthHeaders() }
    ).subscribe({
      next: (res) => {
        this.addrSaving = false;
        if (res.success) {
          this.userAddresses = res.data?.addresses || [];
          // Auto-select the newly added address on all carts
          const newIdx = this.userAddresses.length - 1;
          this.carts.forEach(cv => cv.selectedAddressIdx = newIdx);
          this.showAddForm = false;
        } else {
          this.addrError = res.message || 'Failed to save address.';
        }
      },
      error: (err) => {
        this.addrSaving = false;
        this.addrError  = err?.error?.message || 'Failed to save address.';
      }
    });
  }

  // ── DELETE ADDRESS ───────────────────────────────────────────────────
  deleteAddress(addr: any, idx: number): void {
    if (this.deletingAddrId) return;  // prevent double-click
    const addrId = addr._id;
    if (!addrId) return;

    const user = this.authService.getUser();
    if (!user) return;

    this.deletingAddrId = addrId;
    this.http.delete<any>(
      `${this.baseUrl}/users/${user.id}/addresses/${addrId}`,
      { headers: this.authService.getAuthHeaders() }
    ).subscribe({
      next: (res) => {
        this.deletingAddrId = null;
        if (res.success) {
          this.userAddresses = res.data?.addresses || [];
          // Fix selectedAddressIdx on all carts to avoid out-of-bounds
          this.carts.forEach(cv => {
            if (cv.selectedAddressIdx >= this.userAddresses.length) {
              cv.selectedAddressIdx = Math.max(0, this.userAddresses.length - 1);
            }
          });
        }
      },
      error: () => { this.deletingAddrId = null; }
    });
  }

  private loadRestaurantName(cv: CartView): void {
    this.customerService.getRestaurantById(cv.restaurantId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          cv.restaurantName        = res.data.restaurantName || cv.restaurantId;
          cv.restaurantRating      = res.data.rating      || 0;
          cv.restaurantReviewCount = res.data.reviewCount || 0;
          // City mismatch check
          const restCity = (res.data.city || '').toLowerCase().trim();
          const selCity  = this.selectedCity.toLowerCase().trim();
          cv.restaurantCity = restCity;
          cv.cityMismatch   = !!(restCity && selCity && restCity !== selCity);
        }
      },
      error: () => {}
    });
  }

  // ── TOTALS ───────────────────────────────────────────────────────────
  subtotalOf(cv: CartView): number {
    return cv.items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
  }

  itemCountOf(cv: CartView): number {
    return cv.items.reduce((s, i) => s + (i.quantity || 1), 0);
  }

  finalTotalOf(cv: CartView): number {
    return Math.max(0, this.subtotalOf(cv) - cv.discountAmount);
  }

  get totalItemsAcrossAllCarts(): number {
    return this.carts.reduce((s, cv) => s + this.itemCountOf(cv), 0);
  }

  // ── COUPON ───────────────────────────────────────────────────────────
  onCouponChange(cv: CartView): void {
    cv.couponApplied  = false;
    cv.couponMessage  = '';
    cv.couponError    = '';
    cv.discountAmount = 0;
  }

  applyCoupon(cv: CartView): void {
    const code = cv.couponCode.trim().toUpperCase();
    if (!code) return;

    // UPI150 requires UPI payment method — validate on frontend before even calling context
    if (code === 'UPI150' && cv.paymentMethod !== 'upi') {
      cv.couponApplied  = false;
      cv.discountAmount = 0;
      cv.couponError    = '❌ UPI150 is only valid when paying via UPI. Please select UPI as payment method.';
      return;
    }

    // BOGO1 requires Net Banking
    if (code === 'BOGO1' && cv.paymentMethod !== 'netbanking') {
      cv.couponApplied  = false;
      cv.discountAmount = 0;
      cv.couponError    = '❌ BOGO1 is only valid when paying via Net Banking. Please select Net Banking as payment method.';
      return;
    }

    if (code === 'PREM20') {
      // Need restaurant rating & reviewCount — use cached values (set by loadRestaurantName)
      const isPremium = cv.restaurantRating > 4.5 && cv.restaurantReviewCount > 200;
      this._applyWithContext(cv, code, { isFirstOrder: false, isPremiumRestaurant: isPremium });
    } else if (code === 'FIRST70') {
      const user = this.authService.getUser();
      this.http.get<any>(`${this.baseUrl}/orders/user/${user?.id}`, {
        headers: this.authService.getAuthHeaders()
      }).subscribe({
        next: (res) => {
          const orders: any[] = res?.data || [];
          const isFirst = orders.filter((o: any) => o.status === 'delivered').length === 0;
          this._applyWithContext(cv, code, { isFirstOrder: isFirst });
        },
        error: () => {
          cv.couponError    = '❌ Could not verify order history. Please try again.';
          cv.discountAmount = 0;
        }
      });
    } else {
      this._applyWithContext(cv, code, { isFirstOrder: false });
    }
  }

  private _applyWithContext(cv: CartView, code: string, ctx: CouponContext): void {
    const result = computeDiscount(code, this.subtotalOf(cv), ctx);
    if (result.valid) {
      cv.couponApplied  = true;
      cv.couponError    = '';
      cv.discountAmount = result.discount;
      cv.couponMessage  = result.message;
      localStorage.setItem('couponCode', code);
    } else {
      cv.couponApplied  = false;
      cv.couponError    = result.reason || 'Coupon not valid.';
      cv.discountAmount = 0;
    }
  }

  removeCoupon(cv: CartView): void {
    cv.couponCode     = '';
    cv.couponApplied  = false;
    cv.couponMessage  = '';
    cv.couponError    = '';
    cv.discountAmount = 0;
    localStorage.removeItem('couponCode');
  }

  // ── QUANTITY CONTROLS ────────────────────────────────────────────────
  increase(cv: CartView, item: any): void {
    if (!cv.cartId || this.inFlight[item.itemId]) return;
    this.inFlight = { ...this.inFlight, [item.itemId]: true };
    const newQty = (item.quantity || 1) + 1;
    this.customerService.updateCartItemQuantity(cv.cartId, item.itemId, newQty).subscribe({
      next: (res) => {
        this.inFlight = { ...this.inFlight, [item.itemId]: false };
        if (res.success) { item.quantity = newQty; if (cv.couponApplied) this.applyCoupon(cv); }
      },
      error: () => { this.inFlight = { ...this.inFlight, [item.itemId]: false }; }
    });
  }

  decrease(cv: CartView, item: any): void {
    if (!cv.cartId || this.inFlight[item.itemId]) return;
    this.inFlight = { ...this.inFlight, [item.itemId]: true };
    if ((item.quantity || 1) <= 1) {
      this.customerService.removeFromCart(cv.cartId, item.itemId).subscribe({
        next: (res) => {
          this.inFlight = { ...this.inFlight, [item.itemId]: false };
          if (res.success) {
            cv.items = cv.items.filter(i => i.itemId !== item.itemId);
            // Remove empty cart tab
            if (cv.items.length === 0) this._removeCart(cv);
            else if (cv.couponApplied) this.applyCoupon(cv);
          }
        },
        error: () => { this.inFlight = { ...this.inFlight, [item.itemId]: false }; }
      });
    } else {
      const newQty = item.quantity - 1;
      this.customerService.updateCartItemQuantity(cv.cartId, item.itemId, newQty).subscribe({
        next: (res) => {
          this.inFlight = { ...this.inFlight, [item.itemId]: false };
          if (res.success) { item.quantity = newQty; if (cv.couponApplied) this.applyCoupon(cv); }
        },
        error: () => { this.inFlight = { ...this.inFlight, [item.itemId]: false }; }
      });
    }
  }

  clearCart(cv: CartView): void {
    if (!cv.cartId) return;
    this.customerService.clearCart(cv.cartId).subscribe({
      next: () => this._removeCart(cv),
      error: () => {}
    });
  }

  private _removeCart(cv: CartView): void {
    const idx = this.carts.indexOf(cv);
    this.carts = this.carts.filter(c => c !== cv);
    this.activeIdx = Math.min(idx, this.carts.length - 1);
  }

  // ── PLACE ORDER ──────────────────────────────────────────────────────
  /**
   * Place order for a single cart.
   * @param batchMode  If true, don't navigate away — used by placeAllOrders().
   * @returns Promise<string | null>  resolves to orderId on success, null on failure.
   */
  placeOrder(cv: CartView, batchMode = false): Promise<string | null> {
    return new Promise((resolve) => {
      if (cv.items.length === 0) { resolve(null); return; }
      const user = this.authService.getUser();
      if (!user) { this.router.navigate(['/auth']); resolve(null); return; }

      cv.loading      = true;
      cv.errorMessage = '';
      cv.priceWarning = '';

      const proceed = () => {
        this.http.get<any>(`${this.baseUrl}/users/${user.id}`, {
          headers: this.authService.getAuthHeaders()
        }).subscribe({
          next: (profileRes) => {
            const addresses: any[] = this.userAddresses.length
              ? this.userAddresses
              : (profileRes?.data?.addresses || []);
            const addr = addresses[cv.selectedAddressIdx] || addresses[0];
            if (!addr) {
              cv.loading      = false;
              cv.errorMessage = '📍 No delivery address saved. Please go to Profile and add one first.';
              resolve(null); return;
            }
            const clientOrderId = `${user.id}_${cv.restaurantId}_${Date.now()}`;
            this.orderService.createOrder({
              userId:         user.id,
              restaurantId:   cv.restaurantId,
              addressId:      String(addr._id),
              paymentMethod:  cv.paymentMethod,
              couponCode:     cv.couponApplied ? cv.couponCode.toUpperCase() : undefined,
              discountAmount: cv.couponApplied ? cv.discountAmount : 0,
              finalAmount:    this.finalTotalOf(cv),
              clientOrderId
            }).subscribe({
              next: (response) => {
                cv.loading = false;
                if (response.success) {
                  localStorage.removeItem('couponCode');
                  const orderId = response.data?.id || 'Placed';
                  if (batchMode) {
                    // Mark cart as placed but don't remove yet
                    cv.orderPlaced   = true;
                    cv.placedOrderId = orderId;
                    resolve(orderId);
                  } else {
                    this._removeCart(cv);
                    this.router.navigate(['/customer/success'], {
                      state: { orderId }
                    });
                    resolve(orderId);
                  }
                } else {
                  cv.errorMessage = response.message || 'Failed to place order.';
                  resolve(null);
                }
              },
              error: (err) => {
                cv.loading      = false;
                cv.errorMessage = err?.error?.message || 'Error placing order. Please try again.';
                resolve(null);
              }
            });
          },
          error: () => { cv.loading = false; cv.errorMessage = 'Could not fetch your profile.'; resolve(null); }
        });
      };

      // Price validation
      this.http.get<any>(`${this.baseUrl}/menu/restaurant/${cv.restaurantId}`).subscribe({
        next: (menuRes) => {
          const liveItems: any[] = menuRes?.data || [];
          const changed: string[] = [];
          for (const ci of cv.items) {
            const live = liveItems.find((m: any) => m.menuId === ci.itemId);
            if (!live) continue;
            if (live.price !== ci.price) {
              changed.push(`${ci.itemName} (₹${ci.price}→₹${live.price})`);
              ci.price = live.price;
            }
          }
          if (changed.length > 0) {
            cv.loading      = false;
            cv.priceWarning = `⚠️ Price changed: ${changed.join(', ')}. Review & place again.`;
            if (cv.couponApplied) this.applyCoupon(cv);
            resolve(null);
          } else {
            proceed();
          }
        },
        error: () => proceed()
      });
    });
  }

  // ── PLACE ALL ORDERS AT ONCE ─────────────────────────────────────────
  placeAllLoading = false;
  placeAllError   = '';

  async placeAllOrders(): Promise<void> {
    const readyCarts = this.carts.filter(cv => cv.items.length > 0 && !cv.orderPlaced);
    if (readyCarts.length === 0) return;

    this.placeAllLoading = true;
    this.placeAllError   = '';

    // Fire all orders in parallel
    const results = await Promise.all(readyCarts.map(cv => this.placeOrder(cv, true)));

    this.placeAllLoading = false;

    const successIds  = results.filter((id): id is string => id !== null);
    const failCount   = results.filter(id => id === null).length;

    if (successIds.length > 0) {
      // Remove successfully placed carts
      this.carts = this.carts.filter(cv => !cv.orderPlaced);
      this.activeIdx = 0;

      if (failCount === 0) {
        // All succeeded — navigate with all order IDs
        this.router.navigate(['/customer/success'], {
          state: { orderId: successIds[0], allOrderIds: successIds }
        });
      } else {
        // Some failed — show partial success message
        this.placeAllError =
          `✅ ${successIds.length} order(s) placed! ❌ ${failCount} failed — review above errors.`;
      }
    } else {
      this.placeAllError = '❌ All orders failed. Please check the errors above and try again.';
    }
  }

  // ── SINGLE ORDER (void wrapper for template click handlers) ─────────────
  placeSingleOrder(cv: CartView): void {
    this.placeOrder(cv, false);
  }

  // ── NAV ──────────────────────────────────────────────────────────────
  goHome():     void { this.router.navigate(['/customer/customer-home']); }
  goToOffers(): void { this.router.navigate(['/customer/discounts']); }
}
