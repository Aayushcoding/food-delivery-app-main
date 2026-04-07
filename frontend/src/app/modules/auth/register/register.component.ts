import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  registerForm!: FormGroup;
  submitted = false;
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
  }

  private initForm(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNo: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['Customer', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  get f() {
    return this.registerForm.controls;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ 'passwordMismatch': true });
      return { 'passwordMismatch': true };
    }
    return null;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    const selectedRole = this.f['role'].value === 'Owner' ? 'Owner' : 'Customer';
    const user = {
      username: this.f['username'].value,
      email: this.f['email'].value,
      phoneNo: this.f['phoneNo'].value,
      password: this.f['password'].value,
      role: selectedRole
    };

    this.authService.register(user).subscribe(
      (createdUser) => {
        this.loading = false;
        // After successful registration, redirect to login page
        this.router.navigate(['/auth/login'], { 
          queryParams: { 
            message: 'Registration successful! Please login with your credentials.',
            role: createdUser?.role 
          }
        });
      },
      error => {
        console.error('Register error:', error);
        this.loading = false;
      }
    );
  }

}