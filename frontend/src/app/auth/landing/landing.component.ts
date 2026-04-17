import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getUser();
      if (user?.role === 'Owner')              this.router.navigate(['/owner/dashboard']);
      else if (user?.role === 'DeliveryAgent') this.router.navigate(['/delivery/dashboard']);
      else                                     this.router.navigate(['/customer/customer-home']);
    }
  }

  goTo(role: 'customer' | 'owner' | 'delivery'): void {
    const roleMap: Record<string, string> = {
      customer: 'Customer',
      owner:    'Owner',
      delivery: 'DeliveryAgent'
    };
    this.router.navigate(['/auth'], { queryParams: { role: roleMap[role] } });
  }
}
