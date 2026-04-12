import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
selector:'app-customer-home',
templateUrl:'./customer-home.component.html',
styleUrls:['./customer-home.component.css']
})
export class CustomerHomeComponent implements OnInit{

isLoggedIn=false;
userName='Guest';
searchQuery='';
cartCount=0;
cartItems:any[]=[];
cartOpen=false;
profileOpen=false;
loading=false;

cuisineTags=['Chinese','Italian','Indian','Mexican','FastFood','Continental'];
selectedCuisines=new Set<string>();

allRestaurants:any[]=[];
filteredRestaurants:any[]=[];

constructor(
private customerService:CustomerService,
private authService:AuthService,
private router:Router
){
this.loadUser();
}

ngOnInit():void{
this.loadRestaurants();
this.loadCartCount();
}

loadUser(){
const user=this.authService.getUser();
if(user){
this.isLoggedIn=true;
this.userName=user.username||user.email||'User';
}
}

get cartTotal():number{
return this.cartItems.reduce((sum,item)=>sum+(item.price||0)*(item.quantity||1),0);
}

// Load the backend cart count to display badge
loadCartCount(){
const user=this.authService.getUser();
if(!user) return;

this.customerService.getCart(user.id).subscribe({
next:(res)=>{
if(res.success && res.data){
this.cartItems=res.data.items||[];
this.cartCount=this.cartItems.length;
}
},
error:()=>{
// 404 = no cart yet, that's fine
this.cartItems=[];
this.cartCount=0;
}
});
}

loadRestaurants(){
this.loading=true;
this.customerService.getRestaurants().subscribe({
next:(response)=>{
if(response.success){
this.allRestaurants=response.data||[];
this.filteredRestaurants=[...this.allRestaurants];
}
this.loading=false;
},
error:(err)=>{
console.error('Error loading restaurants:',err);
this.loading=false;
}
});
}

onSearchInput(){
this.filterRestaurants();
}

filterRestaurants(){
let filtered=[...this.allRestaurants];

if(this.searchQuery.trim()){
filtered=filtered.filter(r=>
r.restaurantName.toLowerCase().includes(this.searchQuery.toLowerCase())
);
}

if(this.selectedCuisines.size>0){
filtered=filtered.filter(r=>{
const restaurantCuisines=Array.isArray(r.cuisine)?r.cuisine:[];
return restaurantCuisines.some((c:any)=>this.selectedCuisines.has(c));
});
}

this.filteredRestaurants=filtered;
}

toggleCuisine(cuisine:string){
if(this.selectedCuisines.has(cuisine)){
this.selectedCuisines.delete(cuisine);
}else{
this.selectedCuisines.add(cuisine);
}
this.filterRestaurants();
}

viewMenu(restaurant:any){
this.router.navigate(['/menu',restaurant.restaurantId],{
state:{restaurant:restaurant}
});
}

toggleCart(){
this.cartOpen=!this.cartOpen;
this.profileOpen=false;
// Refresh cart items when opening sidebar
if(this.cartOpen) this.loadCartCount();
}

goToCart(){
this.cartOpen=false;
this.router.navigate(['/customer/cart']);
}

toggleProfileMenu(){
this.profileOpen=!this.profileOpen;
this.cartOpen=false;
}

logout(){
this.authService.logout();
this.isLoggedIn=false;
this.userName='Guest';
this.profileOpen=false;
this.cartItems=[];
this.cartCount=0;
this.router.navigate(['/login']);
}

getItemLabel(item:any):string{
return item.itemId||'Item';
}

goToLogin(){
this.router.navigate(['/login']);
}

getCuisineString(cuisineArray:any):string{
if(Array.isArray(cuisineArray)){
return cuisineArray.join(', ');
}
return cuisineArray||'';
}

}