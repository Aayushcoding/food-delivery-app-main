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

constructor(private fb:FormBuilder, private router:Router, private loginService:LoginService){}

ngOnInit():void{
this.signupForm=this.fb.group({
username:['',[Validators.required]],
email:['',[Validators.required,Validators.email]],
password:['',[Validators.required,Validators.minLength(6)]],
contact:['',[Validators.required]],
restaurantName:[''],
address:this.fb.group({
street:['',[Validators.required]],
city:['',[Validators.required]]
})
});
}

selectRole(role:string){
this.role=role;
}

onSubmit(){
if(this.signupForm.invalid){
this.signupForm.markAllAsTouched();
return;
}

this.isLoading=true;
this.errorMessage='';
this.successMessage='';

const formValue=this.signupForm.value;
const payload:any={
username: formValue.username,
email: formValue.email,
password: formValue.password,
phoneNo: formValue.contact,
address: [{ street: formValue.address?.street, city: formValue.address?.city }],
role: this.role==='owner' ? 'Owner' : 'Customer'
};

if(this.role==='owner' && formValue.restaurantName){
payload.restaurantName=formValue.restaurantName;
}

this.loginService.register(payload).subscribe({
next:(res)=>{
this.isLoading=false;
if(res.success){
this.successMessage='Account created successfully! Redirecting to login...';
setTimeout(()=>this.router.navigate(['/login']),1500);
}else{
this.errorMessage=res.message||'Registration failed.';
}
},
error:(err)=>{
this.isLoading=false;
const msg=err?.error?.message||'Registration failed. Please try again.';
this.errorMessage=msg;
}
});
}
}