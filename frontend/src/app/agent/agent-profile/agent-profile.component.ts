import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-agent-profile',
  templateUrl: './agent-profile.component.html',
  styleUrls: ['./agent-profile.component.css']
})
export class AgentProfileComponent implements OnInit {

  agent: any = null;
  profile: any = null;

  // Editable fields
  username  = '';
  phoneNo   = '';
  cities: string[] = [];

  // City input
  cityInput = '';

  loading  = false;
  saving   = false;
  toast    = { msg: '', error: false };
  private toastTimer: any;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.agent = this.authService.getUser();
    if (!this.agent || !['DeliveryAgent', 'Delivery'].includes(this.agent.role)) {
      this.router.navigate(['/']);
      return;
    }
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.http.get<any>('/api/agent/profile', {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: res => {
        this.profile  = res.data;
        this.username = res.data.username || '';
        this.phoneNo  = res.data.phoneNo  || '';
        this.cities   = Array.isArray(res.data.cities) ? [...res.data.cities] : [];
        this.loading  = false;
      },
      error: () => {
        // Fall back to cached user
        this.username = this.agent.username || '';
        this.phoneNo  = this.agent.phoneNo  || '';
        this.cities   = Array.isArray(this.agent.cities) ? [...this.agent.cities] : [];
        this.loading  = false;
        this.showToast('Could not load profile from server — showing cached data.', true);
      }
    });
  }

  // ── City management ───────────────────────────────────────────────────────

  addCity(): void {
    const city = this.cityInput.trim().toLowerCase();
    if (!city) return;
    if (this.cities.includes(city)) {
      this.showToast(`"${city}" is already in your list.`, true);
      this.cityInput = '';
      return;
    }
    this.cities = [...this.cities, city];
    this.cityInput = '';
  }

  removeCity(city: string): void {
    this.cities = this.cities.filter(c => c !== city);
  }

  onCityKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.addCity();
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  saveProfile(): void {
    if (!this.username.trim()) {
      this.showToast('Username cannot be empty.', true);
      return;
    }
    this.saving = true;
    this.http.put<any>('/api/agent/profile',
      { username: this.username.trim(), phoneNo: this.phoneNo.trim(), cities: this.cities },
      { headers: this.authService.getAuthHeaders() }
    ).subscribe({
      next: res => {
        this.saving = false;
        this.profile = res.data;
        // Update localStorage
        const stored = this.authService.getUser() || {};
        this.authService.saveUserAndToken(
          { ...stored, username: res.data.username, phoneNo: res.data.phoneNo, cities: res.data.cities },
          this.authService.getToken() || ''
        );
        this.showToast('✅ Profile saved successfully!', false);
      },
      error: err => {
        this.saving = false;
        this.showToast(err?.error?.message || 'Could not save profile.', true);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  showToast(msg: string, error: boolean): void {
    this.toast = { msg, error };
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.msg = '', 3500);
  }

  goBack(): void {
    this.router.navigate(['/agent/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
