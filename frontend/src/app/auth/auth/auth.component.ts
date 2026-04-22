import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoginService } from 'src/app/core/services/login.service';

type Role = 'Customer' | 'Owner' | 'DeliveryAgent';
type Mode = 'login' | 'signup';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {

  // ── State ───────────────────────────────────────────────
  mode: Mode = 'login';
  role: Role = 'Customer';

  // ── Form fields ─────────────────────────────────────────
  username = '';
  email    = '';   // used as email-or-username on login
  password = '';
  phoneNo  = '';
  // Address (Customer & DeliveryAgent signup)
  street  = '';
  city    = '';
  pincode = '';

  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // ── Config ──────────────────────────────────────────────
  readonly roles: { value: Role; label: string; emoji: string }[] = [
    { value: 'Customer', label: 'Customer', emoji: '👤' },
    { value: 'Owner', label: 'Restaurant Owner', emoji: '🍴' },
    { value: 'DeliveryAgent', label: 'Delivery Agent', emoji: '🛵' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private loginService: LoginService
  ) { }

  ngOnInit(): void {
    // If already logged in — redirect to role home
    if (this.authService.isLoggedIn()) {
      this.redirectByRole(this.authService.getUser()?.role);
      return;
    }

    // Pre-select role from query param: ?role=Owner&mode=signup
    const qRole = this.route.snapshot.queryParamMap.get('role') as Role | null;
    const qMode = this.route.snapshot.queryParamMap.get('mode') as Mode | null;

    if (qRole && this.roles.some(r => r.value === qRole)) this.role = qRole;
    if (qMode === 'signup') this.mode = 'signup';
  }

  // ── Role / Mode selection ────────────────────────────────
  selectRole(r: Role): void {
    this.role = r;
    this.clearMessages();
  }

  switchMode(m: Mode): void {
    this.mode = m;
    this.clearMessages();
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  // ── Validation helper ────────────────────────────────────
  get isFormValid(): boolean {
    if (!this.email.trim() || !this.password) return false;
    if (this.mode === 'signup' && !this.username.trim()) return false;
    if (this.mode === 'signup' && this.password.length < 6) return false;
    return true;
  }

  // ── Login (email OR username) ─────────────────────────
  onLogin(): void {
    this.clearMessages();
    const identifier = this.email.trim();
    if (!identifier) { this.errorMessage = 'Email or username is required.'; return; }
    if (!this.password) { this.errorMessage = 'Password is required.'; return; }

    this.isLoading = true;
    this.loginService.login({ email: identifier, password: this.password, role: this.role })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          const user = res.data || res;
          const token = res.token;
          if (!token) { this.errorMessage = 'Login failed — no token received.'; return; }
          this.authService.saveUserAndToken(user, token);

          // Restore saved city so customer-home filters by their city automatically
          const addrs = user?.addresses || user?.address || [];
          const savedCity = Array.isArray(addrs) && addrs.length > 0 ? addrs[0].city : '';
          if (savedCity) localStorage.setItem('selectedCity', savedCity.toLowerCase().trim());

          this.redirectByRole(this.role);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || 'Invalid credentials. Please try again.';
        }
      });
  }

  // ── Signup ───────────────────────────────────────────────
  onSignup(): void {
    this.clearMessages();

    if (!this.username.trim()) { this.errorMessage = 'Username is required.'; return; }
    if (!this.email.trim())    { this.errorMessage = 'Email is required.'; return; }
    if (this.password.length < 6) { this.errorMessage = 'Password must be at least 6 characters.'; return; }
    // Phone required for ALL roles
    if (!this.phoneNo.trim()) { this.errorMessage = 'Phone number is required.'; return; }
    if (!/^\d{10}$/.test(this.phoneNo.trim())) {
      this.errorMessage = 'Phone must be exactly 10 digits.'; return;
    }
    // Address required for Customer and DeliveryAgent
    if (this.role !== 'Owner') {
      if (!this.street.trim())  { this.errorMessage = 'Street / Area is required.'; return; }
      if (!this.city.trim())    { this.errorMessage = 'City is required.'; return; }
      if (!this.pincode.trim()) { this.errorMessage = 'Pincode is required.'; return; }
      if (!/^\d{6}$/.test(this.pincode.trim())) {
        this.errorMessage = 'Pincode must be exactly 6 digits.'; return;
      }
    }

    const payload: any = {
      username: this.username.trim(),
      email:    this.email.trim(),
      password: this.password,
      phoneNo:  this.phoneNo.trim(),
      role:     this.role
    };

    // Always include address for Customer & DeliveryAgent
    if (this.role !== 'Owner') {
      payload.addresses = [{
        street:  this.street.trim(),
        city:    this.city.trim().toLowerCase(),
        pincode: this.pincode.trim()
      }];
    }

    this.isLoading = true;
    this.loginService.register(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          // Persist city so customer-home filters correctly right after signup
          if (this.city.trim()) {
            localStorage.setItem('selectedCity', this.city.trim().toLowerCase());
          }
          this.successMessage = '✅ Account created! Please login.';
          this.mode     = 'login';
          this.password = '';
          this.username = '';
          this.street   = '';
          this.city     = '';
          this.pincode  = '';
        } else {
          this.errorMessage = res.message || 'Registration failed.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  onSubmit(): void {
    this.mode === 'login' ? this.onLogin() : this.onSignup();
  }

  // ── Redirect after login ─────────────────────────────────
  private redirectByRole(role: Role | string | undefined): void {
    if (role === 'Owner') this.router.navigate(['/owner/dashboard']);
    else if (role === 'DeliveryAgent') this.router.navigate(['/agent/dashboard']);
    else this.router.navigate(['/customer/customer-home']);
  }

  // ── Helpers ──────────────────────────────────────────────
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /** Returns the right accent class for the currently selected role */
  get roleClass(): string {
    if (this.role === 'Owner') return 'accent-purple';
    if (this.role === 'DeliveryAgent') return 'accent-green';
    return 'accent-orange';
  }
}
