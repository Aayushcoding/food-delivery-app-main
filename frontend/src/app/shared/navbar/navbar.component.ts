import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
selector:'app-navbar',
templateUrl:'./navbar.component.html',
styleUrls:['./navbar.component.css']
})
export class NavbarComponent{

constructor(private router:Router){}

goHome(){
this.router.navigate(['/customer/customer-home']);
}

goCart(){
this.router.navigate(['/customer/cart']);
}

goOrders(){
this.router.navigate(['/customer/orders']);
}

logout(){
localStorage.removeItem('user');
this.router.navigate(['/login']);
}
}