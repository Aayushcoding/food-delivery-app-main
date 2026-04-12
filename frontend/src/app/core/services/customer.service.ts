import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
providedIn:'root'
})
export class CustomerService{

private baseUrl='http://localhost:5000/api';

constructor(private http:HttpClient, private authService:AuthService){}

// ── RESTAURANTS ────────────────────────────────────────────────────
getRestaurants(search?:string):Observable<any>{
let url=`${this.baseUrl}/restaurants`;
if(search){ url+=`?search=${search}`; }
return this.http.get(url);
}

getRestaurantById(id:string):Observable<any>{
return this.http.get(`${this.baseUrl}/restaurants/${id}`);
}

getRestaurantByOwner(ownerId:string):Observable<any>{
return this.http.get(`${this.baseUrl}/restaurants/owner/${ownerId}`, { headers: this.authService.getAuthHeaders() });
}

// ── MENUS ──────────────────────────────────────────────────────────
getMenu(restaurantId?:string):Observable<any>{
let url=`${this.baseUrl}/menu`;
if(restaurantId){ url+=`?restaurantId=${restaurantId}`; }
return this.http.get(url);
}

getMenuByRestaurant(restaurantId:string):Observable<any>{
return this.http.get(`${this.baseUrl}/menu/restaurant/${restaurantId}`);
}

addMenuItem(menuData:any):Observable<any>{
return this.http.post(`${this.baseUrl}/menu`, menuData, { headers: this.authService.getAuthHeaders() });
}

updateMenuItemData(menuId:string, data:any):Observable<any>{
return this.http.put(`${this.baseUrl}/menu/${menuId}`, data, { headers: this.authService.getAuthHeaders() });
}

deleteMenuItemById(menuId:string):Observable<any>{
return this.http.delete(`${this.baseUrl}/menu/${menuId}`, { headers: this.authService.getAuthHeaders() });
}

// ── CART ───────────────────────────────────────────────────────────
getCart(userId:string):Observable<any>{
return this.http.get(`${this.baseUrl}/cart/user/${userId}`, { headers: this.authService.getAuthHeaders() });
}

createCart(cart:any):Observable<any>{
return this.http.post(`${this.baseUrl}/cart`, cart, { headers: this.authService.getAuthHeaders() });
}

addToCart(userId:string, itemId:string, quantity:number, price:number):Observable<any>{
return this.http.post(`${this.baseUrl}/cart/add-item`,{
userId, itemId, quantity, price
}, { headers: this.authService.getAuthHeaders() });
}

updateCartItemQuantity(cartId:string, itemId:string, quantity:number):Observable<any>{
return this.http.put(`${this.baseUrl}/cart/update-quantity`,{
cartId, itemId, quantity
}, { headers: this.authService.getAuthHeaders() });
}

removeFromCart(cartId:string, itemId:string):Observable<any>{
return this.http.post(`${this.baseUrl}/cart/remove-item`,{
cartId, itemId
}, { headers: this.authService.getAuthHeaders() });
}

clearCart(cartId:string):Observable<any>{
return this.http.delete(`${this.baseUrl}/cart/${cartId}`, { headers: this.authService.getAuthHeaders() });
}

// ── ORDERS ─────────────────────────────────────────────────────────
createOrder(order:any):Observable<any>{
return this.http.post(`${this.baseUrl}/orders`, order, { headers: this.authService.getAuthHeaders() });
}

getUserOrders(userId:string):Observable<any>{
return this.http.get(`${this.baseUrl}/orders/user/${userId}`, { headers: this.authService.getAuthHeaders() });
}

getOrdersByRestaurant(restaurantId:string):Observable<any>{
return this.http.get(`${this.baseUrl}/orders/restaurant/${restaurantId}`, { headers: this.authService.getAuthHeaders() });
}

getOrderById(orderId:string):Observable<any>{
return this.http.get(`${this.baseUrl}/orders/${orderId}`, { headers: this.authService.getAuthHeaders() });
}

updateOrderStatus(orderId:string, status:string):Observable<any>{
return this.http.put(`${this.baseUrl}/orders/${orderId}/status`, {status}, { headers: this.authService.getAuthHeaders() });
}

// ── PAYMENT ────────────────────────────────────────────────────────
processPayment(orderId:string, userId:string):Observable<any>{
return this.http.post(`${this.baseUrl}/payment/pay`,{
orderId, userId
}, { headers: this.authService.getAuthHeaders() });
}
}