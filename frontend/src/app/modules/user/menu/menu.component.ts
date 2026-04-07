import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { Menu, CartItem } from '../../../shared/models/index';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  restaurantId!: string;
  menus: Menu[] = [];
  loading = true;
  quantities: { [key: string]: number } = {};

  constructor(
    private apiService: ApiService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.restaurantId = this.route.snapshot.paramMap.get('restaurantId') || '';
    this.loadMenu();
  }

  loadMenu(): void {
    this.apiService.getMenusByRestaurant(this.restaurantId).subscribe(
      (data) => {
        this.menus = data;
        this.menus.forEach(item => {
          this.quantities[item.menuId] = 1;
        });
        this.loading = false;
      },
      (error) => {
        console.error('Error loading menu:', error);
        this.loading = false;
      }
    );
  }

  addToCart(item: Menu): void {
    const quantity = this.quantities[item.menuId] || 1;
    const cartItem: CartItem = {
      itemId: item.menuId,
      quantity: quantity,
      price: item.price
    };
    this.cartService.addToCart(cartItem, item.restaurantId).catch(error => {
      console.error('Error adding to cart:', error);
    });
    alert(`${item.itemName} added to cart!`);
  }

  goToCart(): void {
    this.router.navigate(['/user/cart']);
  }

}