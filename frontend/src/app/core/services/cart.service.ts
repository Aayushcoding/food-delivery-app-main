import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Cart, CartItem, User } from '../../shared/models/index';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartItems = new BehaviorSubject<CartItem[]>([]);
  private totalAmount = new BehaviorSubject<number>(0);
  private currentCartId: string | null = null;
  private currentRestaurantId: string | null = null;
  private currentUser: User | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadCartFromBackend(user.id);
      } else {
        this.clearCartLocal();
      }
    });
  }

  getCartItems(): Observable<CartItem[]> {
    return this.cartItems.asObservable();
  }

  getTotalAmount(): Observable<number> {
    return this.totalAmount.asObservable();
  }

  async addToCart(item: CartItem, restaurantId: string): Promise<void> {
    const currentItems = [...this.cartItems.value];
    const existingItem = currentItems.find(i => i.itemId === item.itemId);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      currentItems.push(item);
    }

    this.cartItems.next(currentItems);
    this.calculateTotal();
    await this.syncCartToBackend(restaurantId);
  }

  async removeFromCart(itemId: string, restaurantId: string): Promise<void> {
    const currentItems = this.cartItems.value.filter(i => i.itemId !== itemId);
    this.cartItems.next(currentItems);
    this.calculateTotal();
    await this.syncCartToBackend(restaurantId);
  }

  async updateQuantity(itemId: string, quantity: number, restaurantId: string): Promise<void> {
    const currentItems = [...this.cartItems.value];
    const item = currentItems.find(i => i.itemId === itemId);

    if (!item) {
      return;
    }

    if (quantity <= 0) {
      await this.removeFromCart(itemId, restaurantId);
      return;
    }

    item.quantity = quantity;
    this.cartItems.next(currentItems);
    this.calculateTotal();
    await this.syncCartToBackend(restaurantId);
  }

  async clearCart(): Promise<void> {
    this.cartItems.next([]);
    this.totalAmount.next(0);
    if (this.currentUser) {
      if (this.currentCartId) {
        await firstValueFrom(this.apiService.deleteCart(this.currentCartId)).catch(() => null);
      }
      this.currentCartId = null;
      this.currentRestaurantId = null;
    }
    this.clearCartLocal();
  }

  private calculateTotal(): void {
    const total = this.cartItems.value.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
    this.totalAmount.next(total);
  }

  private clearCartLocal(): void {
    this.cartItems.next([]);
    this.totalAmount.next(0);
    localStorage.removeItem('cart');
  }

  private async loadCartFromBackend(userId: string): Promise<void> {
    try {
      const carts = await firstValueFrom(this.apiService.getCarts(userId));
      if (carts && carts.length) {
        const cart = carts[0];
        this.currentCartId = cart.id;
        this.currentRestaurantId = cart.restaurantId || null;
        this.cartItems.next(cart.items || []);
        this.totalAmount.next(cart.totalAmount || 0);
        localStorage.setItem('cart', JSON.stringify(cart.items || []));
      } else {
        this.currentRestaurantId = null;
        this.clearCartLocal();
      }
    } catch {
      this.clearCartLocal();
    }
  }

  private async syncCartToBackend(restaurantId: string): Promise<void> {
    if (!this.currentUser) {
      this.saveCartToStorage();
      return;
    }

    const cartPayload: Cart = {
      id: this.currentCartId || `cart_${Date.now()}`,
      userId: this.currentUser.id,
      restaurantId,
      items: this.cartItems.value,
      totalAmount: this.totalAmount.value
    };

    this.currentRestaurantId = restaurantId;
    if (this.currentCartId) {
      try {
        const updatedCart = await firstValueFrom(this.apiService.updateCart(this.currentCartId, cartPayload));
        this.currentCartId = updatedCart.id;
      } catch {
        const createdCart = await firstValueFrom(this.apiService.createCart(cartPayload));
        this.currentCartId = createdCart.id;
      }
    } else {
      const createdCart = await firstValueFrom(this.apiService.createCart(cartPayload));
      this.currentCartId = createdCart.id;
    }

    this.saveCartToStorage();
  }

  private saveCartToStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems.value));
  }

  getCartMetadata(): { cartId: string | null; restaurantId: string | null } {
    return { cartId: this.currentCartId, restaurantId: this.currentRestaurantId };
  }
}
