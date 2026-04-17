import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from 'src/app/core/services/login.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  signupForm!: FormGroup;
  /** 'customer' | 'owner' | 'delivery' */
  role = 'customer';
  isLoading    = false;
  errorMessage  = '';
  successMessage = '';

  constructor(
    private fb:           FormBuilder,
    private router:       Router,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._]+$/)]],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(16)]],
      contact:  [''],   // optional — validated conditionally in onSubmit
      street:   [''],
      city:     ['']
    });
  }

  selectRole(r: string): void {
    // Delivery Agent gets its own dedicated page — redirect immediately
    if (r === 'delivery') {
      this.router.navigate(['/signup/delivery']);
      return;
    }
    this.role = r;
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading     = false;
    this.errorMessage  = '';
    this.successMessage = '';

    const v = this.signupForm.value;

    const payload: any = {
      username: v.username,
      email:    v.email,
      password: v.password,
      phoneNo:  v.contact?.trim() || '',
      role:     this.role === 'owner' ? 'Owner' : 'Customer'
    };

    // Only include address if both street and city are provided
    if (v.street?.trim() && v.city?.trim()) {
      payload.address = [{ street: v.street.trim(), city: v.city.trim() }];
    }

    this.isLoading = true;

    this.loginService.register(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.successMessage = 'Account created! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/select-role']), 1500);
        } else {
          this.errorMessage = res.message || 'Registration failed.';
        }
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}