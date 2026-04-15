import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  user: any = null;
  restaurants: any[] = [];
  editData: any = {};
  loading = true;
  restaurantsLoading = true;
  saving = false;
  editing = false;

  toastMessage = '';
  toastError = false;
  private toastTimer: any;

  readonly DEFAULT_IMAGE = 'assets/default-restaurant.svg';
  private baseUrl = '/api';

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    const stored = this.authService.getUser();
    if (!stored) { this.router.navigate(['/login']); return; }
    this.loadUser(stored.id);
    this.loadRestaurants(stored.id);
  }

  loadUser(userId: string): void {
    this.http.get<any>(`${this.baseUrl}/users/${userId}`).subscribe({
      next: (res) => {
        if (res.success && res.data) this.user = res.data;
        this.loading = false;
      },
      error: () => {
        this.user = this.authService.getUser();
        this.loading = false;
      }
    });
  }

  loadRestaurants(ownerId: string): void {
    this.restaurantsLoading = true;
    this.customerService.getRestaurantByOwner(ownerId).subscribe({
      next: (res) => { this.restaurants = res.success ? (res.data || []) : []; this.restaurantsLoading = false; },
      error: () => { this.restaurants = []; this.restaurantsLoading = false; }
    });
  }

  startEdit(): void {
    this.editing = true;
    this.editData = {
      username: this.user.username || '',
      phoneNo: this.user.phoneNo || ''
    };
  }

  cancelEdit(): void {
    this.editing = false;
    this.editData = {};
  }

  save(): void {
    if (!this.editData.username?.trim()) {
      this.showToast('Name cannot be empty.', true);
      return;
    }
    this.saving = true;
    const payload: any = {
      username: this.editData.username.trim(),
      phoneNo: this.editData.phoneNo?.trim() || ''
    };

    this.http.put<any>(
      `${this.baseUrl}/users/${this.user.id}`,
      payload,
      { headers: this.authService.getAuthHeaders() }
    ).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.user = { ...this.user, ...res.data };
          const stored = this.authService.getUser();
          if (stored) {
            localStorage.setItem('user', JSON.stringify({ ...stored, username: this.user.username }));
          }
          this.editing = false;
          this.showToast('✅ Profile updated!', false);
        } else {
          this.showToast(res.message || 'Update failed.', true);
        }
      },
      error: (err) => {
        this.saving = false;
        this.showToast(err?.error?.message || 'Error saving profile.', true);
      }
    });
  }

  imgOf(rest: any): string {
    return rest.displayImage || this.DEFAULT_IMAGE;
  }

  getCuisine(rest: any): string {
    return Array.isArray(rest.cuisine) ? rest.cuisine.join(', ') : (rest.cuisine || '');
  }

  goBack(): void { this.router.navigate(['/restaurant']); }
  goToRestaurant(rest: any): void {
    this.router.navigate(['/owner/menu'], {
      state: { restaurantId: rest.restaurantId, restaurantName: rest.restaurantName }
    });
  }

  showToast(msg: string, isError: boolean): void {
    this.toastMessage = msg;
    this.toastError = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 3000);
  }
}
