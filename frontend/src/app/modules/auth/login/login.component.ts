import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  loginForm!: FormGroup;
  submitted = false;
  loading = false;
  selectedRole: 'Customer' | 'Owner' = 'Customer';
  successMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Handle query params from registration redirect
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.successMessage = params['message'];
      }
      if (params['role']) {
        this.selectedRole = params['role'] as 'Customer' | 'Owner';
      }
    });
  }

  private initForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  selectRole(role: 'Customer' | 'Owner'): void {
    this.selectedRole = role;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login(this.f['email'].value, this.f['password'].value, this.selectedRole).subscribe(
      (user) => {
        if (this.selectedRole === 'Customer') {
          this.router.navigate(['/user/home']);
        } else {
          this.router.navigate(['/owner/dashboard']);
        }
      },
      error => {
        console.error('Login error:', error);
        this.loading = false;
      }
    );
  }

}