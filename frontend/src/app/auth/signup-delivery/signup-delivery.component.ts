import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryService } from 'src/app/core/services/delivery.service';

@Component({
  selector: 'app-signup-delivery',
  templateUrl: './signup-delivery.component.html',
  styleUrls: ['./signup-delivery.component.css']
})
export class SignupDeliveryComponent {

  username  = '';
  email     = '';
  password  = '';
  phoneNo   = '';

  showPassword = false;
  isLoading    = false;
  errorMessage = '';
  successMsg   = '';

  constructor(
    private deliveryService: DeliveryService,
    private router: Router
  ) {}

  get isValid(): boolean {
    return !!(this.username.trim() && this.email.trim() && this.password.length >= 6);
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMsg   = '';

    if (!this.username.trim()) { this.errorMessage = 'Username is required.'; return; }
    if (!this.email.trim())    { this.errorMessage = 'Email is required.';    return; }
    if (this.password.length < 6) { this.errorMessage = 'Password must be at least 6 characters.'; return; }
    if (this.phoneNo && !/^\d{10}$/.test(this.phoneNo.trim())) {
      this.errorMessage = 'Phone must be exactly 10 digits.'; return;
    }

    this.isLoading = true;

    this.deliveryService.registerAgent({
      username: this.username.trim(),
      email:    this.email.trim(),
      password: this.password,
      phoneNo:  this.phoneNo.trim()
    }).subscribe({
      next: () => {
        this.successMsg = '✅ Registration successful! Redirecting to login...';
        this.isLoading  = false;
        setTimeout(() => this.router.navigate(['/login/delivery']), 1800);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }

  goBack(): void { this.router.navigate(['/select-role']); }
}
