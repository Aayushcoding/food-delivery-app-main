import { Component, OnInit } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { ApiService } from '../../../core/services/api.service';
import { CartItem } from '../../../shared/models/index';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {

  cartItems: CartItem[] = [];
  totalAmount = 0;
  placingOrder = false;

  constructor(
    private cartService: CartService,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
    });

    this.cartService.getTotalAmount().subscribe(total => {
      this.totalAmount = total;
    });
  }

  removeItem(itemId: string): void {
    const metadata = this.cartService.getCartMetadata();
    this.cartService.removeFromCart(itemId, metadata.restaurantId || '').catch(error => {
      console.error('Remove item error:', error);
    });
  }

  updateQuantity(itemId: string, quantity: number): void {
    const metadata = this.cartService.getCartMetadata();
    this.cartService.updateQuantity(itemId, quantity, metadata.restaurantId || '').catch(error => {
      console.error('Update quantity error:', error);
    });
  }

  placeOrder(): void {
    if (this.cartItems.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const userData = localStorage.getItem('user');
    if (!userData) {
      alert('Please log in before placing an order.');
      return;
    }

    const user = JSON.parse(userData);
    const metadata = this.cartService.getCartMetadata();
    if (!metadata.restaurantId) {
      alert('Unable to determine restaurant for the cart.');
      return;
    }

    this.placingOrder = true;

    const orderPayload = {
      userId: user.id,
      restaurantId: metadata.restaurantId,
      items: this.cartItems,
      totalAmount: this.totalAmount,
      status: 'Pending',
      deliveryAgentId: ''
    };

    this.apiService.createOrder(orderPayload).subscribe(
      () => {
        alert('Order placed successfully!');
        this.cartService.clearCart().catch(error => console.error('Clear cart error:', error));
        this.placingOrder = false;
      },
      (error) => {
        console.error('Order placement error:', error);
        alert('Failed to place order. Please try again.');
        this.placingOrder = false;
      }
    );
  }
}