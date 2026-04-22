import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-owner-dashboard',
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.css']
})
export class OwnerDashboardComponent implements OnInit {

  // ── State ──────────────────────────────────────────────────────────
  owner: any = null;
  restaurants: any[]  = [];
  selectedRestaurant: any = null;

  stats = { totalOrders: 0, pendingOrders: 0, totalRevenue: 0 };

  loading    = true;
  statsLoading = false;
  error      = '';

  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.owner = this.authService.getUser();
    if (!this.owner) { this.router.navigate(['/']); return; }

    this.loadRestaurants();
  }

  // ── 1. Fetch all restaurants owned by this owner ──────────────────
  loadRestaurants(): void {
    this.loading = true;
    this.customerService.getRestaurantByOwner(this.owner.id).subscribe({
      next: (res) => {
        this.restaurants = res.success ? (res.data || []) : [];
        this.loading = false;

        if (this.restaurants.length > 0) {
          // Restore previous selection from sessionStorage, or default to first
          const savedId = sessionStorage.getItem('ownerRestaurantId');
          const found   = savedId ? this.restaurants.find(r => r.restaurantId === savedId) : null;
          this.selectRestaurant(found || this.restaurants[0]);
        }
      },
      error: () => {
        this.error   = 'Could not load restaurants. Is the backend running?';
        this.loading = false;
      }
    });
  }

  // ── 2. Select active restaurant and load its dashboard stats ───────
  selectRestaurant(restaurant: any): void {
    this.selectedRestaurant = restaurant;
    sessionStorage.setItem('ownerRestaurantId',   restaurant.restaurantId);
    sessionStorage.setItem('ownerRestaurantName', restaurant.restaurantName);

    this.loadDashboardStats(restaurant.restaurantId);
  }

  // ── 3. Load real dashboard stats from backend ──────────────────────
  loadDashboardStats(restaurantId: string): void {
    this.statsLoading = true;
    this.customerService.getRestaurantDashboard(restaurantId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats = {
            totalOrders:  res.data.totalOrders  || 0,
            pendingOrders: res.data.pendingOrders || 0,
            totalRevenue: res.data.totalRevenue  || 0
          };
        }
        this.statsLoading = false;
      },
      error: () => {
        this.stats = { totalOrders: 0, pendingOrders: 0, totalRevenue: 0 };
        this.statsLoading = false;
      }
    });
  }

  // ── Navigation helpers ─────────────────────────────────────────────
  goHome(): void {
    this.router.navigate(['/restaurant']);
  }

  goToOrders(): void {
    if (!this.selectedRestaurant) return;
    this.router.navigate(['/owner/orders'], {
      state: {
        restaurantId:   this.selectedRestaurant.restaurantId,
        restaurantName: this.selectedRestaurant.restaurantName
      }
    });
  }

  goToMenu(): void {
    if (!this.selectedRestaurant) return;
    this.router.navigate(['/owner/menu'], {
      state: {
        restaurantId:   this.selectedRestaurant.restaurantId,
        restaurantName: this.selectedRestaurant.restaurantName
      }
    });
  }
}