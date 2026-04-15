import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {

  owner: any = null;
  restaurants: any[] = [];
  selectedRestaurant: any = null;
  orders: any[] = [];

  loading = true;
  saving = false;
  deletingId: string | null = null;
  errorMessage = '';

  // Toast
  toastMessage = '';
  toastError = false;
  private toastTimer: any;

  // Add Restaurant form
  showAddForm = false;
  newRestaurant = { restaurantName: '', cuisine: '' };
  newRestFile: File | null = null;
  newRestPreview: string | null = null;

  // Rename / Edit state
  renamingId: string | null = null;
  renameValue = '';
  renameImageValue = '';   // optional URL (kept for manual URL entry)
  renameCuisineValue = '';
  renameAddressValue = '';
  renameContactValue = '';
  renameFile: File | null = null;
  renamePreview: string | null = null;



  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.owner = this.authService.getUser();
    if (!this.owner) { this.router.navigate(['/login']); return; }
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.loading = true;
    this.customerService.getRestaurantByOwner(this.owner.id).subscribe({
      next: (res) => {
        this.restaurants = res.success ? (res.data || []) : [];
        this.loading = false;
      },
      error: () => { this.restaurants = []; this.loading = false; }
    });
  }

  selectRestaurant(rest: any): void {
    if (this.selectedRestaurant?.restaurantId === rest.restaurantId) {
      this.selectedRestaurant = null;
      this.orders = [];
      return;
    }
    this.selectedRestaurant = rest;
    this.orders = [];
    this.loadOrders(rest.restaurantId);
  }

  loadOrders(restaurantId: string): void {
    this.customerService.getOrdersByRestaurant(restaurantId).subscribe({
      next: (res) => { this.orders = res.success ? (res.data || []) : []; },
      error: () => { this.orders = []; }
    });
  }

  get totalOrders(): number { return this.orders.length; }
  get totalEarnings(): number {
    return this.orders
      .filter(o => o.status === 'delivered')
      .reduce((s, o) => s + (o.totalAmount || 0), 0);
  }
  get pendingOrders(): number { return this.orders.filter(o => o.status === 'pending').length; }

  // ── Navigation ──────────────────────────────────────────────────────
  goToMenu(rest: any): void {
    sessionStorage.setItem('ownerRestaurantId', rest.restaurantId);
    sessionStorage.setItem('ownerRestaurantName', rest.restaurantName || '');
    this.router.navigate(['/owner/menu'], {
      state: { restaurantId: rest.restaurantId, restaurantName: rest.restaurantName }
    });
  }

  goToOrders(rest: any): void {
    sessionStorage.setItem('ownerRestaurantId', rest.restaurantId);
    sessionStorage.setItem('ownerRestaurantName', rest.restaurantName || '');
    this.router.navigate(['/owner/orders'], {
      state: { restaurantId: rest.restaurantId, restaurantName: rest.restaurantName }
    });
  }

  // ── Add Restaurant ──────────────────────────────────────────────────
  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    this.newRestaurant = { restaurantName: '', cuisine: '' };
    this.newRestFile = null;
    this.newRestPreview = null;
  }

  onNewRestFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.newRestFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.newRestPreview = e.target?.result as string;
      reader.readAsDataURL(this.newRestFile);
    }
  }

  addRestaurant(): void {
    if (!this.newRestaurant.restaurantName.trim()) {
      this.showToast('Restaurant name is required.', true);
      return;
    }
    this.saving = true;
    const cuisineArray = this.newRestaurant.cuisine
      ? this.newRestaurant.cuisine.split(',').map(c => c.trim()).filter(Boolean)
      : [];

    const fd = new FormData();
    fd.append('restaurantName', this.newRestaurant.restaurantName.trim());
    fd.append('ownerId', this.owner.id);
    fd.append('cuisine', JSON.stringify(cuisineArray));
    if (this.newRestFile) {
      fd.append('displayImage', this.newRestFile, this.newRestFile.name);
    }

    this.customerService.createRestaurant(fd).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.restaurants.push(res.data);
          this.showAddForm = false;
          this.newRestaurant = { restaurantName: '', cuisine: '' };
          this.newRestFile = null;
          this.newRestPreview = null;
          this.showToast('✅ Restaurant created!', false);
        } else {
          this.showToast(res.message || 'Failed to create restaurant.', true);
        }
      },
      error: (err) => {
        this.saving = false;
        this.showToast(err?.error?.message || 'Error creating restaurant.', true);
      }
    });
  }

  // ── Edit Restaurant ─────────────────────────────────────────────────
  startRename(rest: any): void {
    this.renamingId = rest.restaurantId;
    this.renameValue = rest.restaurantName;
    this.renameImageValue = '';
    this.renameCuisineValue = Array.isArray(rest.cuisine) ? rest.cuisine.join(', ') : (rest.cuisine || '');
    this.renameAddressValue = rest.address || '';
    this.renameContactValue = rest.restaurantContactNo || '';
    this.renameFile    = null;
    this.renamePreview = null;
  }

  onRenameFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.renameFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.renamePreview = e.target?.result as string;
      reader.readAsDataURL(this.renameFile);
    }
  }

  saveRename(rest: any): void {
    if (!this.renameValue.trim()) {
      this.showToast('Restaurant name cannot be empty.', true);
      return;
    }
    const cuisineArray = this.renameCuisineValue
      ? this.renameCuisineValue.split(',').map(c => c.trim()).filter(Boolean)
      : (Array.isArray(rest.cuisine) ? rest.cuisine : []);

    const fd = new FormData();
    fd.append('restaurantName',      this.renameValue.trim());
    fd.append('cuisine',             JSON.stringify(cuisineArray));
    fd.append('address',             this.renameAddressValue.trim());
    fd.append('restaurantContactNo', this.renameContactValue.trim());
    if (this.renameFile) {
      fd.append('displayImage', this.renameFile, this.renameFile.name);
    }

    this.customerService.updateRestaurant(rest.restaurantId, fd).subscribe({
      next: (res) => {
        if (res.success) {
          rest.restaurantName      = this.renameValue.trim();
          rest.cuisine             = cuisineArray;
          rest.address             = this.renameAddressValue.trim();
          rest.restaurantContactNo = this.renameContactValue.trim();
          if (res.data?.displayImage) rest.displayImage = res.data.displayImage;
          if (this.selectedRestaurant?.restaurantId === rest.restaurantId) {
            Object.assign(this.selectedRestaurant, rest);
          }
          this.renamingId    = null;
          this.renameFile    = null;
          this.renamePreview = null;
          this.showToast('✅ Restaurant updated!', false);
        } else {
          this.showToast(res.message || 'Failed to update.', true);
        }
      },
      error: () => this.showToast('Error updating restaurant.', true)
    });
  }

  cancelRename(): void {
    this.renamingId    = null;
    this.renameFile    = null;
    this.renamePreview = null;
  }

  deleteRestaurant(rest: any): void {
    if (!confirm(`Delete "${rest.restaurantName}"? This cannot be undone.`)) return;
    this.deletingId = rest.restaurantId;
    this.customerService.deleteRestaurant(rest.restaurantId).subscribe({
      next: (res) => {
        this.deletingId = null;
        if (res.success) {
          this.restaurants = this.restaurants.filter(r => r.restaurantId !== rest.restaurantId);
          if (this.selectedRestaurant?.restaurantId === rest.restaurantId) {
            this.selectedRestaurant = null;
            this.orders = [];
          }
          this.showToast('🗑 Restaurant deleted.', false);
        } else {
          this.showToast(res.message || 'Failed to delete restaurant.', true);
        }
      },
      error: (err) => {
        this.deletingId = null;
        this.showToast(err?.error?.message || 'Error deleting restaurant.', true);
      }
    });
  }

  imgOf(rest: any): string {
    return rest.displayImage || rest.imageUrl || '';
  }

  getCuisineString(c: any): string {
    return Array.isArray(c) ? c.join(', ') : (c || '');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToProfile(): void {
    this.router.navigate(['/owner/profile']);
  }

  showToast(msg: string, isError: boolean): void {
    this.toastMessage = msg;
    this.toastError = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 3000);
  }
}