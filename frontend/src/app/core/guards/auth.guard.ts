import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // 1. Must be logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return false;
    }


    // 2. Role enforcement — only checked when route declares required roles
    const requiredRoles = route.data?.['roles'] as string[] | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      const user = this.authService.getUser();
      if (!user || !requiredRoles.includes(user.role)) {
        // Redirect to correct home based on actual role
        if (user?.role === 'Owner') {
          this.router.navigate(['/restaurant']);
        } else if (user?.role === 'DeliveryAgent') {
          this.router.navigate(['/agent/dashboard']);
        } else {
          this.router.navigate(['/customer/customer-home']);
        }
        return false;
      }
    }

    return true;
  }

}
