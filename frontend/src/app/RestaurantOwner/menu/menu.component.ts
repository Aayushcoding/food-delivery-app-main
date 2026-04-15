import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  // File selected for new item
  newItemFile: File | null = null;
  newItemPreview: string | null = null;

  // Edit state
  editingId: string | null = null;
  editData: any = {};
  editFile: File | null = null;
  editPreview: string | null = null;



  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const owner = this.authService.getUser();
    if (!owner) { this.router.navigate(['/login']); return; }

    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;

    if (state?.restaurantId) {
      sessionStorage.setItem('ownerRestaurantId', state.restaurantId);
      sessionStorage.setItem('ownerRestaurantName', state.restaurantName || '');
      this.loadRestaurantById(state.restaurantId);
    } else {
      const storedId = sessionStorage.getItem('ownerRestaurantId');
      if (storedId) {
        this.loadRestaurantById(storedId);
      } else {
        this.customerService.getRestaurantByOwner(owner.id).subscribe({
          next: (res) => {
            const list: any[] = res.success ? (res.data || []) : [];
            if (list.length > 0) {
              this.loadRestaurantById(list[0].restaurantId);
            } else {
              this.errorMessage = 'No restaurant found. Create one from the dashboard.';
              this.loading = false;
            }
          },
          error: () => { this.errorMessage = 'Failed to load restaurant.'; this.loading = false; }
        });
      }
    }
  }

  loadRestaurantById(restaurantId: string): void {
    this.customerService.getRestaurantById(restaurantId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.restaurant = res.data;
          this.loadMenu();
        } else {
          this.errorMessage = 'Restaurant not found.';
          this.loading = false;
        }
      },
      error: () => { this.errorMessage = 'Failed to load restaurant.'; this.loading = false; }
    });
  }

  loadMenu(): void {
    this.customerService.getMenuByRestaurantOwner(this.restaurant.restaurantId).subscribe({
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
    this.newItemFile = null;
    this.newItemPreview = null;
  }

  /** Called when user picks a file in the Add-Item form */
  onNewFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.newItemFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.newItemPreview = e.target?.result as string;
      reader.readAsDataURL(this.newItemFile);
    }
  }

  /** Called when user picks a file in the Edit form */
  onEditFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.editFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.editPreview = e.target?.result as string;
      reader.readAsDataURL(this.editFile);
    }
  }

  addItem(): void {
    if (!this.newItem.itemName.trim()) {
      this.showToast('Item name is required.', true);
      return;
    }
    if (!this.newItem.price || this.newItem.price <= 0) {
      this.showToast('A valid price is required.', true);
      return;
    }
    this.saving = true;

    const fd = new FormData();
    fd.append('restaurantId',  this.restaurant.restaurantId);
    fd.append('itemName',      this.newItem.itemName.trim());
    fd.append('price',         String(this.newItem.price));
    fd.append('category',      this.newItem.category.trim());
    fd.append('description',   this.newItem.description.trim());
    fd.append('isVeg',         String(this.newItem.isVeg));
    fd.append('isAvailable',   'true');
    if (this.newItemFile) {
      fd.append('image', this.newItemFile, this.newItemFile.name);
    }

    this.customerService.addMenuItem(fd).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.menuItems.push(res.data);
          this.showAddForm = false;
          this.newItem = { itemName: '', price: 0, category: '', description: '', isVeg: true };
          this.newItemFile = null;
          this.newItemPreview = null;
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
    this.editData = {
      itemName:    item.itemName,
      price:       item.price,
      category:    item.category || '',
      description: item.description || '',
      isVeg:       item.isVeg,
      isAvailable: item.isAvailable
    };
    this.editFile    = null;
    this.editPreview = null;
  }

  saveEdit(item: any): void {
    const fd = new FormData();
    fd.append('itemName',    this.editData.itemName);
    fd.append('price',       String(this.editData.price));
    fd.append('category',    this.editData.category || '');
    fd.append('description', this.editData.description || '');
    fd.append('isVeg',       String(this.editData.isVeg));
    fd.append('isAvailable', String(this.editData.isAvailable));
    if (this.editFile) {
      fd.append('image', this.editFile, this.editFile.name);
    }

    this.customerService.updateMenuItemData(item.menuId, fd).subscribe({
      next: (res) => {
        if (res.success) {
          Object.assign(item, this.editData);
          // If a new image was uploaded, refresh it from server response
          if (res.data?.image) item.image = res.data.image;
          this.editingId = null;
          this.editFile = null;
          this.editPreview = null;
          this.showToast('✅ Item updated!', false);
        }
      },
      error: () => this.showToast('Failed to update item.', true)
    });
  }

  cancelEdit(): void {
    this.editingId   = null;
    this.editFile    = null;
    this.editPreview = null;
  }

  toggleAvailability(item: any): void {
    this.customerService.updateMenuItemData(item.menuId, { isAvailable: !item.isAvailable }).subscribe({
      next: (res) => {
        if (res.success) {
          item.isAvailable = !item.isAvailable;
          this.showToast(item.isAvailable ? '✅ Item activated' : '🔕 Item deactivated', false);
        }
      },
      error: () => this.showToast('Failed to update availability.', true)
    });
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

  imgOf(item: any): string {
    return item.image || item.imageUrl || '';
  }

  showToast(msg: string, isError: boolean): void {
    this.toastMessage = msg;
    this.toastError = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 3000);
  }

  goBack(): void { this.router.navigate(['/restaurant']); }
}