import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.authService.getCurrentUserValue();
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    const expectedRoles = route.data['roles'] as string[];
    if (expectedRoles && !expectedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user's actual role
      switch (user.role) {
        case 'Customer':
          this.router.navigate(['/user/home']);
          break;
        case 'Owner':
          this.router.navigate(['/owner/dashboard']);
          break;
        case 'DeliveryAgent':
          this.router.navigate(['/delivery/dashboard']);
          break;
        default:
          this.router.navigate(['/login']);
      }
      return false;
    }

    return true;
  }
}