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
    const addr = Array.isArray(this.user.address) && this.user.address.length > 0
      ? this.user.address[0]
      : (typeof this.user.address === 'object' ? this.user.address : {});
    this.editData = {
      username: this.user.username || '',
      email: this.user.email || '',
      phoneNo: this.user.phoneNo || '',
      street: addr?.street || '',
      city: addr?.city || ''
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
    // Build address array
    if (this.editData.street || this.editData.city) {
      payload.address = [{ street: this.editData.street || '', city: this.editData.city || '' }];
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
    if (!this.user?.address) return '—';
    if (Array.isArray(this.user.address) && this.user.address.length > 0) {
      const a = this.user.address[0];
      return [a.street, a.city].filter(Boolean).join(', ') || '—';
    }
    if (typeof this.user.address === 'string') return this.user.address || '—';
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