import {Component,OnInit} from '@angular/core';
import {FormBuilder,Validators,FormGroup} from '@angular/forms';
import {LoginService} from 'src/app/core/services/login.service';
import {AuthService} from 'src/app/core/services/auth.service';
import {Router} from '@angular/router';

@Component({
selector:'app-login',
templateUrl:'./login.component.html',
styleUrls:['./login.component.css']
})
export class LoginComponent implements OnInit{

loginForm!:FormGroup;
isLoading=false;
errorMessage='';

constructor(
private fb:FormBuilder,
private loginService:LoginService,
private authService:AuthService,
private router:Router
){}

ngOnInit():void{
// If already logged in, redirect
if(this.authService.isLoggedIn()){
const user=this.authService.getUser();
this.redirectByRole(user?.role);
return;
}

this.loginForm=this.fb.group({
role:['Customer'],
email:['',[Validators.required,Validators.email]],
password:['',[Validators.required,Validators.minLength(6)]],
restaurantName:['']
});
}

get f(){
return this.loginForm.controls;
}

onSubmit():void{
if(this.loginForm.invalid){
this.loginForm.markAllAsTouched();
return;
}

this.isLoading=true;
this.errorMessage='';

// Only send email + password to backend
const {email,password}=this.loginForm.value;

this.loginService.login({email,password}).subscribe({
next:(res)=>{
const user=res.data||res;
const token=res.token;

if(!token){
this.errorMessage='Login failed: no token received.';
this.isLoading=false;
return;
}

this.authService.saveUserAndToken(user,token);
this.redirectByRole(user.role);
this.isLoading=false;
},

error:(err)=>{
this.errorMessage=err?.error?.message||'Invalid credentials. Please try again.';
this.isLoading=false;
}
});
}

private redirectByRole(role:string):void{
if(role==='Owner'){
this.router.navigate(['/restaurant']);
}else if(role==='DeliveryAgent'){
this.router.navigate(['/delivery']);
}else{
this.router.navigate(['/customer/customer-home']);
}
}
}