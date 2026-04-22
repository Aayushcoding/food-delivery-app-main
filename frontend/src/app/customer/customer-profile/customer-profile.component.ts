import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-profile',
  templateUrl: './customer-profile.component.html',
  styleUrls: ['./customer-profile.component.css']
})
export class CustomerProfileComponent implements OnInit {

  user: any = null;
  editData: any = {};
  loading = true;
  saving = false;
  editing = false;

  toastMessage = '';
  toastError = false;
  private toastTimer: any;

  private baseUrl = '/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const stored = this.authService.getUser();
    if (!stored) { this.loading = false; return; }
    this.loadUser(stored.id);
  }

  loadUser(userId: string): void {
    this.loading = true;
    this.http.get<any>(`${this.baseUrl}/users/${userId}`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.user = res.data;
        }
        this.loading = false;
      },
      error: () => {
        // Fallback to localStorage if API fails
        this.user = this.authService.getUser();
        this.loading = false;
      }
    });
  }

  startEdit(): void {
    this.editing = true;
    // support both 'addresses' (new) and legacy 'address' field
    const addrList = Array.isArray(this.user.addresses) && this.user.addresses.length > 0
      ? this.user.addresses
      : (Array.isArray(this.user.address) ? this.user.address : []);
    const addr = addrList.length > 0
      ? addrList[0]
      : (typeof this.user.address === 'object' ? this.user.address : {});
    this.editData = {
      username: this.user.username || '',
      email: this.user.email || '',
      phoneNo: this.user.phoneNo || '',
      street: addr?.street || '',
      city: addr?.city || '',
      pincode: addr?.pincode || '',
      landmark: addr?.landmark || ''
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
    // Build addresses array using the new field name
    if (this.editData.street || this.editData.city) {
      payload.addresses = [{
        street:   this.editData.street   || '',
        city:     this.editData.city     || '',
        pincode:  this.editData.pincode  || '',
        landmark: this.editData.landmark || ''
      }];
    }

    this.http.put<any>(
      `${this.baseUrl}/users/${this.user.id}`,
      payload,
      { headers: this.authService.getAuthHeaders() }
    ).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.user = { ...this.user, ...res.data };
          // Update localStorage so navbar reflects new name
          const stored = this.authService.getUser();
          if (stored) {
            localStorage.setItem('user', JSON.stringify({ ...stored, username: this.user.username }));
          }
          // Persist selected city so customer-home can filter restaurants
          if (this.editData.city && this.editData.city.trim()) {
            localStorage.setItem('selectedCity', this.editData.city.trim().toLowerCase());
          }
          this.editing = false;
          this.showToast('✅ Profile updated!', false);
        } else {
          this.showToast(res.message || 'Failed to update profile.', true);
        }
      },
      error: (err) => {
        this.saving = false;
        this.showToast(err?.error?.message || 'Error saving profile.', true);
      }
    });
  }

  getAddressString(): string {
    // Support both 'addresses' (new) and legacy 'address' field
    const list = Array.isArray(this.user?.addresses) && this.user.addresses.length > 0
      ? this.user.addresses
      : (Array.isArray(this.user?.address) ? this.user.address : []);
    if (list.length > 0) {
      const a = list[0];
      return [a.street, a.city, a.pincode].filter(Boolean).join(', ') || '—';
    }
    if (typeof this.user?.address === 'string') return this.user.address || '—';
    return '—';
  }

  goBack(): void {
    this.router.navigate(['/customer/customer-home']);
  }

  showToast(msg: string, isError: boolean): void {
    this.toastMessage = msg;
    this.toastError = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 3000);
  }
}