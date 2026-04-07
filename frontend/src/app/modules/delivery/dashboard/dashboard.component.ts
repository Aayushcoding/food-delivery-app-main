import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  activeDeliveries = 5;
  completedDeliveries = 45;
  earnings = 12500;

  constructor(private router: Router) { }

  navigateTo(route: string): void {
    this.router.navigate([`/delivery/${route}`]);
  }

}