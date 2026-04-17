import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from 'src/app/core/services/login.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login-delivery',
  templateUrl: './login-delivery.component.html',
  styleUrls: ['./login-delivery.component.css']
})
export class LoginDeliveryComponent implements OnInit {

  form!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/delivery/dashboard']);
      return;
    }
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() { return this.form.controls; }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.form.value;

    this.loginService.login({ email, password, role: 'DeliveryAgent' }).subscribe({
      next: (res) => {
        const user  = res.data || res;
        const token = res.token;
        if (!token) { this.errorMessage = 'Login failed: no token received.'; this.isLoading = false; return; }
        this.authService.saveUserAndToken(user, token);
        this.router.navigate(['/delivery/dashboard']);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Invalid credentials. Please try again.';
        this.isLoading = false;
      }
    });
  }

  goBack(): void { this.router.navigate(['/']); }
}
