import { Component } from '@angular/core';

@Component({
selector:'app-customer-profile',
templateUrl:'./customer-profile.component.html',
styleUrls:['./customer-profile.component.css']
})
export class CustomerProfileComponent{

user={
username:'Aayush',
email:'aayush@gmail.com',
phone:'9876543210',
address:{
street:'Main Road',
city:'Mumbai'
}
};

editing=false;

toggleEdit(){
this.editing=!this.editing;
}

save(){
console.log('Profile updated',this.user);
this.editing=false;
}
}