import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuService } from '../../core/services/menu.service';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-customer-menu',
  templateUrl: './customer-menu.component.html',
  styleUrls: ['./customer-menu.component.css']
})
export class CustomerMenuComponent implements OnInit {

  restaurantId: string = '';
  restaurantName: string = '';
  menuItems: any[] = [];
  loading: boolean = false;

  // cartId needed for quantity updates
  cartId: string = '';

  // menuId → quantity currently in cart
  cartQuantities: { [menuId: string]: number } = {};

  // Track in-flight adds/removes to prevent double-tap
  inFlight: { [menuId: string]: boolean } = {};

  // Toast
  toastMessage: string = '';
  toastError: boolean = false;
  private toastTimer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private menuService: MenuService,
    private authService: AuthService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.restaurantId = params['id'];
      this.loadRestaurantName();
      this.loadMenuItems();
      this.loadCart();
    });
  }

  loadRestaurantName(): void {
    this.customerService.getRestaurantById(this.restaurantId).subscribe({
      next: (res) => {
        if (res.success && res.data) this.restaurantName = res.data.restaurantName;
      },
      error: () => {}
    });
  }

  loadMenuItems(): void {
    this.loading = true;
    this.menuService.getMenuByRestaurant(this.restaurantId).subscribe({
      next: (response) => {
        this.menuItems = response.success ? (response.data || []) : [];
        this.loading = false;
      },
      error: () => { this.loading = false; this.showToast('Failed to load menu.', true); }
    });
  }

  // Load existing cart to know current quantities per item
  loadCart(): void {
    const user = this.authService.getUser();
    if (!user) return;
    this.customerService.getCart(user.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cartId = res.data.id;
          const quantities: { [menuId: string]: number } = {};
          (res.data.items || []).forEach((item: any) => {
            quantities[item.itemId] = item.quantity;
          });
          this.cartQuantities = quantities;
        }
      },
      error: () => {}
    });
  }

  get totalCartCount(): number {
    return Object.values(this.cartQuantities).reduce((a, b) => a + b, 0);
  }

  // Quantity of specific item in cart
  qtyOf(menuId: string): number {
    return this.cartQuantities[menuId] || 0;
  }

  increase(item: any): void {
    const user = this.authService.getUser();
    if (!user) { this.router.navigate(['/login']); return; }
    if (this.inFlight[item.menuId]) return;

    const currentQty = this.qtyOf(item.menuId);

    if (currentQty === 0) {
      // First add — POST add-item
      this.inFlight[item.menuId] = true;
      this.customerService.addToCart(user.id, item.menuId, 1, item.price).subscribe({
        next: (res) => {
          this.inFlight[item.menuId] = false;
          if (res.success) {
            this.cartId = res.data.id;
            this.cartQuantities[item.menuId] = 1;
            this.showToast(`✅ ${item.itemName} added!`, false);
          } else {
            this.showToast(res.message || 'Could not add item.', true);
          }
        },
        error: (err) => {
          this.inFlight[item.menuId] = false;
          this.showToast(err?.error?.message || 'Error adding item.', true);
        }
      });
    } else {
      // Increase qty — PUT update-quantity
      const newQty = currentQty + 1;
      this.inFlight[item.menuId] = true;
      this.customerService.updateCartItemQuantity(this.cartId, item.menuId, newQty).subscribe({
        next: (res) => {
          this.inFlight[item.menuId] = false;
          if (res.success) {
            this.cartQuantities[item.menuId] = newQty;
          }
        },
        error: () => { this.inFlight[item.menuId] = false; }
      });
    }
  }

  decrease(item: any): void {
    const user = this.authService.getUser();
    if (!user) return;
    if (this.inFlight[item.menuId]) return;

    const currentQty = this.qtyOf(item.menuId);
    if (currentQty === 0) return;

    this.inFlight[item.menuId] = true;

    if (currentQty === 1) {
      // Remove entirely
      this.customerService.removeFromCart(this.cartId, item.menuId).subscribe({
        next: (res) => {
          this.inFlight[item.menuId] = false;
          if (res.success) {
            delete this.cartQuantities[item.menuId];
            this.showToast(`🗑 ${item.itemName} removed.`, false);
          }
        },
        error: () => { this.inFlight[item.menuId] = false; }
      });
    } else {
      // Decrease qty
      const newQty = currentQty - 1;
      this.customerService.updateCartItemQuantity(this.cartId, item.menuId, newQty).subscribe({
        next: (res) => {
          this.inFlight[item.menuId] = false;
          if (res.success) {
            this.cartQuantities[item.menuId] = newQty;
          }
        },
        error: () => { this.inFlight[item.menuId] = false; }
      });
    }
  }

  showToast(message: string, isError: boolean): void {
    this.toastMessage = message;
    this.toastError = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 3000);
  }

  goToCart(): void { this.router.navigate(['/customer/cart']); }
  goHome(): void { this.router.navigate(['/customer/customer-home']); }
}
