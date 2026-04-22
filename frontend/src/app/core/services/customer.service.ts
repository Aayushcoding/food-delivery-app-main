import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  // Use relative path — Angular proxy routes /api → http://localhost:3000
  private baseUrl = '/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ── RESTAURANTS ────────────────────────────────────────────────────
  getRestaurants(search?: string, city?: string): Observable<any> {
    const params: string[] = [];
    if (search) { params.push(`search=${encodeURIComponent(search)}`); }
    if (city)   { params.push(`city=${encodeURIComponent(city)}`); }
    const url = `${this.baseUrl}/restaurants${params.length ? '?' + params.join('&') : ''}`;
    return this.http.get(url);
  }

  getRestaurantById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/restaurants/${id}`);
  }

  getRestaurantByOwner(ownerId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/restaurants/owner/${ownerId}`, { headers: this.authService.getAuthHeaders() });
  }

  createRestaurant(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/restaurants`, data, { headers: this.authService.getAuthHeaders() });
  }

  updateRestaurant(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/restaurants/${id}`, data, { headers: this.authService.getAuthHeaders() });
  }

  deleteRestaurant(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/restaurants/${id}`, { headers: this.authService.getAuthHeaders() });
  }

  // ── MENUS (PUBLIC — available items only) ─────────────────────────
  getMenu(restaurantId?: string): Observable<any> {
    let url = `${this.baseUrl}/menu`;
    if (restaurantId) { url += `?restaurantId=${restaurantId}`; }
    return this.http.get(url);
  }

  getMenuByRestaurant(restaurantId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/menu/restaurant/${restaurantId}`);
  }

  // ── MENUS (OWNER — all items including unavailable) ───────────────
  getMenuByRestaurantOwner(restaurantId: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/menu/owner/restaurant/${restaurantId}`,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  addMenuItem(menuData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/menu`, menuData, { headers: this.authService.getAuthHeaders() });
  }

  updateMenuItemData(menuId: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/menu/${menuId}`, data, { headers: this.authService.getAuthHeaders() });
  }

  deleteMenuItemById(menuId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/menu/${menuId}`, { headers: this.authService.getAuthHeaders() });
  }

  // ── CART ───────────────────────────────────────────────────────────
  /** Returns ALL carts for a user (one per restaurant) */
  getCartsByUser(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/cart/user/${userId}`, { headers: this.authService.getAuthHeaders() });
  }

  /** Legacy alias — kept for backward compat (returns first cart or null) */
  getCart(userId: string): Observable<any> {
    return this.getCartsByUser(userId);
  }

  /** Returns the specific cart for a user + restaurant (from the all-carts array) */
  getCartByRestaurant(userId: string, restaurantId: string): Observable<any> {
    return new Observable((obs) => {
      this.getCartsByUser(userId).subscribe({
        next: (res: any) => {
          const all: any[] = Array.isArray(res.data) ? res.data : [];
          const match = all.find((c: any) => c.restaurantId === restaurantId) || null;
          obs.next({ success: true, data: match });
          obs.complete();
        },
        error: (e: any) => obs.error(e)
      });
    });
  }

  // Price is NEVER sent — backend always uses DB price for security
  addToCart(userId: string, itemId: string, quantity: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart/add-item`, {
      userId, itemId, quantity
    }, { headers: this.authService.getAuthHeaders() });
  }

  updateCartItemQuantity(cartId: string, itemId: string, quantity: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/cart/update-quantity`, {
      cartId, itemId, quantity
    }, { headers: this.authService.getAuthHeaders() });
  }

  removeFromCart(cartId: string, itemId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart/remove-item`, {
      cartId, itemId
    }, { headers: this.authService.getAuthHeaders() });
  }

  clearCart(cartId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/${cartId}`, { headers: this.authService.getAuthHeaders() });
  }

  // ── ORDERS ─────────────────────────────────────────────────────────
  createOrder(order: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/orders`, order, { headers: this.authService.getAuthHeaders() });
  }

  getUserOrders(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders/user/${userId}`, { headers: this.authService.getAuthHeaders() });
  }

  getOrdersByRestaurant(restaurantId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders/restaurant/${restaurantId}`, { headers: this.authService.getAuthHeaders() });
  }

  getOrderById(orderId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders/${orderId}`, { headers: this.authService.getAuthHeaders() });
  }

  updateOrderStatus(orderId: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/orders/${orderId}/status`, { status }, { headers: this.authService.getAuthHeaders() });
  }

  // ── PAYMENT ────────────────────────────────────────────────────────
  processPayment(orderId: string, userId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/payment/pay`, {
      orderId, userId
    }, { headers: this.authService.getAuthHeaders() });
  }

  // ── OWNER DASHBOARD ────────────────────────────────────────────────
  // GET /api/restaurants/dashboard?restaurantId=<id>
  // Returns { totalOrders, pendingOrders, totalRevenue }
  getRestaurantDashboard(restaurantId: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/restaurants/dashboard?restaurantId=${encodeURIComponent(restaurantId)}`,
      { headers: this.authService.getAuthHeaders() }
    );
  }
}