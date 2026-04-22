import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
selector:'app-customer-home',
templateUrl:'./customer-home.component.html',
styleUrls:['./customer-home.component.css']
})
export class CustomerHomeComponent implements OnInit, OnDestroy {

isLoggedIn=false;
userName='Guest';
searchQuery='';
cartCount=0;
cartItems:any[]=[];
cartOpen=false;
profileOpen=false;
loading=false;

// City filter
selectedCity: string = '';
noCitySelected = false;

cuisineTags=['Chinese','Italian','Indian','Mexican','FastFood','Continental'];
selectedCuisines=new Set<string>();

allRestaurants:any[]=[];
filteredRestaurants:any[]=[];
private navSub: Subscription | null = null;

constructor(
private customerService:CustomerService,
private authService:AuthService,
private router:Router,
private http: HttpClient
){
this.loadUser();
}

ngOnInit():void{
  this.loadRestaurants();
  this.loadCartCount();
  // Re-read city every time user navigates back to this page
  // (Angular keeps the component alive, ngOnInit doesn't re-fire)
  this.navSub = this.router.events
    .pipe(filter(e => e instanceof NavigationEnd))
    .subscribe(() => {
      this.loadRestaurants();
      this.loadCartCount();
    });
}

ngOnDestroy():void{
  this.navSub?.unsubscribe();
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
  // Read city from localStorage
  const raw = localStorage.getItem('selectedCity') || '';
  this.selectedCity = raw.trim().toLowerCase();
  if (this.selectedCity) localStorage.setItem('selectedCity', this.selectedCity);

  if (!this.selectedCity) {
    // City not in localStorage — try fetching from user profile
    const user = this.authService.getUser();
    if (user?.id) {
      this.http.get<any>(`/api/users/${user.id}`, {
        headers: this.authService.getAuthHeaders()
      }).subscribe({
        next: (res) => {
          const addrs = res?.data?.addresses || [];
          const city  = (addrs[0]?.city || '').toLowerCase().trim();
          if (city) {
            localStorage.setItem('selectedCity', city);
            this.selectedCity    = city;
            this.noCitySelected  = false;
          } else {
            this.noCitySelected = true;
          }
          this._fetchRestaurants();
        },
        error: () => {
          this.noCitySelected = true;
          this._fetchRestaurants();
        }
      });
      return; // _fetchRestaurants called inside
    }
    this.noCitySelected = true;
  } else {
    this.noCitySelected = false;
  }
  this._fetchRestaurants();
}

_fetchRestaurants(){
  this.loading=true;
  this.customerService.getRestaurants(undefined, this.selectedCity || undefined).subscribe({
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

// Clear city filter and reload all restaurants (useful when 0 results in selected city)
clearCityFilter(){
  localStorage.removeItem('selectedCity');
  this.selectedCity = '';
  this.noCitySelected = true;
  this.loadRestaurants();
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

goToProfile(): void {
  this.profileOpen = false;
  this.router.navigate(['/customer/profile']);
}

goToOrders(): void {
  this.profileOpen = false;
  this.router.navigate(['/customer/orders']);
}

getItemLabel(item:any):string{
return item.itemId||'Item';
}

goToLogin(){
this.router.navigate(['/login']);
}

goHome(){
this.router.navigate(['/customer/customer-home']);
}


getCuisineString(cuisineArray:any):string{
if(Array.isArray(cuisineArray)){
return cuisineArray.join(', ');
}
return cuisineArray||'';
}

}