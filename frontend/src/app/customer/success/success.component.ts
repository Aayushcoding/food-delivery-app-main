import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
selector:'app-success',
templateUrl:'./success.component.html',
styleUrls:['./success.component.css']
})
export class SuccessComponent{

orderId: string = '';

constructor(private router:Router){
const nav = this.router.getCurrentNavigation();
this.orderId = nav?.extras?.state?.['orderId'] || '';
}

goHome(){
this.router.navigate(['/customer/customer-home']);
}

goOrders(){
this.router.navigate(['/customer/orders']);
}
}