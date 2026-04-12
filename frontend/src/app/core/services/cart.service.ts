import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
providedIn:'root'
})
export class CartService{

private baseUrl='http://localhost:5000/api/cart';

constructor(private http:HttpClient){}

getCart(userId:string):Observable<any>{
return this.http.get(`${this.baseUrl}/user/${userId}`);
}

createCart(data:any):Observable<any>{
return this.http.post(`${this.baseUrl}`,data);
}

addItem(data:any):Observable<any>{
return this.http.post(`${this.baseUrl}/add-item`,data);
}

updateQuantity(data:any):Observable<any>{
return this.http.put(`${this.baseUrl}/update-quantity`,data);
}

removeItem(data:any):Observable<any>{
return this.http.post(`${this.baseUrl}/remove-item`,data);
}

deleteCart(cartId:string):Observable<any>{
return this.http.delete(`${this.baseUrl}/${cartId}`);
}
}