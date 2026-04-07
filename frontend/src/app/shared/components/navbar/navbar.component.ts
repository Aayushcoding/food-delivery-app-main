import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  isLoggedIn = false;
  currentUser: any = null;
  cartCount = 0;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.isAuthenticated().subscribe(isAuth => {
      this.isLoggedIn = isAuth;
    });

    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    this.cartService.getCartItems().subscribe(items => {
      this.cartCount = items.length;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getHomeLink(): string {
    if (!this.isLoggedIn || !this.currentUser) {
      return '/login';
    }

    switch (this.currentUser.role) {
      case 'Customer':
        return '/user/home';
      case 'Owner':
        return '/owner/dashboard';
      case 'DeliveryAgent':
        return '/delivery/dashboard';
      default:
        return '/login';
    }
  }

}