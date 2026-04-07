import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Restaurant } from '../../../shared/models/index';

@Component({
  selector: 'app-restaurant-list',
  templateUrl: './restaurant-list.component.html',
  styleUrls: ['./restaurant-list.component.css']
})
export class RestaurantListComponent implements OnInit {

  restaurants: Restaurant[] = [];
  loading = true;
  searchText = '';

  constructor(private apiService: ApiService) { }

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

  get filteredRestaurants(): Restaurant[] {
    if (!this.searchText) {
      return this.restaurants;
    }
    return this.restaurants.filter(r =>
      r.restaurantName.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

}