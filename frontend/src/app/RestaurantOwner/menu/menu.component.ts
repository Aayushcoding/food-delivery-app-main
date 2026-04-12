import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  restaurant: any = null;
  menuItems: any[] = [];
  loading = true;
  saving = false;
  errorMessage = '';

  // Toast
  toastMessage = '';
  toastError = false;
  private toastTimer: any;

  // New item form
  newItem = { itemName: '', price: 0, category: '', description: '', isVeg: true };
  showAddForm = false;

  // Edit state: menuId → { price, isAvailable }
  editingId: string | null = null;
  editPrice: number = 0;

  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const owner = this.authService.getUser();
    if (!owner) { this.router.navigate(['/login']); return; }

    this.customerService.getRestaurantByOwner(owner.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.restaurant = res.data;
          this.loadMenu();
        } else {
          this.errorMessage = 'No restaurant found.';
          this.loading = false;
        }
      },
      error: () => { this.errorMessage = 'Failed to load restaurant.'; this.loading = false; }
    });
  }

  loadMenu(): void {
    this.customerService.getMenuByRestaurant(this.restaurant.restaurantId).subscribe({
      next: (res) => {
        this.menuItems = res.success ? (res.data || []) : [];
        this.loading = false;
      },
      error: () => { this.menuItems = []; this.loading = false; }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    this.newItem = { itemName: '', price: 0, category: '', description: '', isVeg: true };
  }

  addItem(): void {
    if (!this.newItem.itemName.trim() || !this.newItem.price) {
      this.showToast('Item name and price are required.', true);
      return;
    }
    this.saving = true;
    const payload = {
      ...this.newItem,
      restaurantId: this.restaurant.restaurantId,
      isAvailable: true
    };
    this.customerService.addMenuItem(payload).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.menuItems.push(res.data);
          this.showAddForm = false;
          this.newItem = { itemName: '', price: 0, category: '', description: '', isVeg: true };
          this.showToast('✅ Item added!', false);
        } else {
          this.showToast(res.message || 'Failed to add item.', true);
        }
      },
      error: (err) => { this.saving = false; this.showToast(err?.error?.message || 'Error adding item.', true); }
    });
  }

  startEdit(item: any): void {
    this.editingId = item.menuId;
    this.editPrice = item.price;
  }

  saveEdit(item: any): void {
    this.customerService.updateMenuItemData(item.menuId, { price: this.editPrice }).subscribe({
      next: (res) => {
        if (res.success) {
          item.price = this.editPrice;
          this.editingId = null;
          this.showToast('✅ Price updated!', false);
        }
      },
      error: () => this.showToast('Failed to update price.', true)
    });
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  deleteItem(item: any): void {
    if (!confirm(`Delete "${item.itemName}"?`)) return;
    this.customerService.deleteMenuItemById(item.menuId).subscribe({
      next: (res) => {
        if (res.success) {
          this.menuItems = this.menuItems.filter(m => m.menuId !== item.menuId);
          this.showToast('🗑 Item deleted.', false);
        }
      },
      error: () => this.showToast('Failed to delete item.', true)
    });
  }

  showToast(msg: string, isError: boolean): void {
    this.toastMessage = msg;
    this.toastError = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 3000);
  }

  goBack(): void { this.router.navigate(['/restaurant']); }
}