import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Restaurant } from '../../../shared/models/index';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  restaurants: Restaurant[] = [];
  loading = true;

  categories = [
    { name: 'Pizza', icon: 'fas fa-pizza-slice' },
    { name: 'Burger', icon: 'fas fa-hamburger' },
    { name: 'Biryani', icon: 'fas fa-utensils' },
    { name: 'Chinese', icon: 'fas fa-dragon' },
    { name: 'Ice Cream', icon: 'fas fa-ice-cream' },
    { name: 'Cake', icon: 'fas fa-birthday-cake' },
    { name: 'Veg', icon: 'fas fa-leaf' },
    { name: 'Non-Veg', icon: 'fas fa-drumstick-bite' }
  ];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.apiService.getRestaurants().subscribe(
      (data) => {
        this.restaurants = data;
        this.loading = false;
      },
      (error) => {
        console.error('Error loading restaurants:', error);
        this.loading = false;
      }
    );
  }

  viewMenu(restaurantId: string): void {
    this.router.navigate(['/user/menu', restaurantId]);
  }

  filterByCategory(category: any): void {
    // Navigate to restaurants page with category filter
    this.router.navigate(['/user/restaurants'], {
      queryParams: { category: category.name.toLowerCase() }
    });
  }
}