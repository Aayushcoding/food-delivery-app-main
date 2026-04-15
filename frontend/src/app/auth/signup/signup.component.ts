import {Component,OnInit} from '@angular/core';
import {FormBuilder,Validators,FormGroup} from '@angular/forms';
import {Router} from '@angular/router';
import {LoginService} from 'src/app/core/services/login.service';

@Component({
  selector:'app-signup',
  templateUrl:'./signup.component.html',
  styleUrls:['./signup.component.css']
})
export class SignupComponent implements OnInit{

  signupForm!:FormGroup;
  role='customer';
  isLoading=false;
  errorMessage='';
  successMessage='';

  constructor(
    private fb:FormBuilder,
    private router:Router,
    private loginService:LoginService
  ){}

  ngOnInit():void{
    this.signupForm=this.fb.group({
      username:['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._]+$/)]],
      email:   ['', [Validators.required, Validators.email]],
      password:['', [Validators.required, Validators.minLength(6), Validators.maxLength(16)]],
      contact: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address: this.fb.group({
        street: ['', [Validators.required]],
        city:   ['', [Validators.required]]
      })
    });
  }

  selectRole(r:string){ this.role=r; }

  onSubmit(){
    if(this.signupForm.invalid){
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading=true;
    this.errorMessage='';
    this.successMessage='';

    const v = this.signupForm.value;

    // Owner registers with credentials only. Restaurants are created from the dashboard.
    const payload:any={
      username: v.username,
      email:    v.email,
      password: v.password,
      phoneNo:  v.contact,
      address:  [{ street: v.address?.street, city: v.address?.city }],
      role:     this.role==='owner' ? 'Owner' : 'Customer'
    };

    this.loginService.register(payload).subscribe({
      next:(res)=>{
        this.isLoading=false;
        if(res.success){
          this.successMessage='Account created! Redirecting to login...';
          setTimeout(()=>this.router.navigate(['/login']),1500);
        }else{
          this.errorMessage=res.message||'Registration failed.';
        }
      },
      error:(err)=>{
        this.isLoading=false;
        this.errorMessage=err?.error?.message||'Registration failed. Please try again.';
      }
    });
  }
}