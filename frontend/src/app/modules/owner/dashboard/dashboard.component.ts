import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  totalOrders = 150;
  totalRevenue = 45000;
  totalMenuItems = 75;

  constructor(private router: Router) { }

  navigateTo(route: string): void {
    this.router.navigate([`/owner/${route}`]);
  }

}