import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
providedIn:'root'
})
export class OrderService{

private baseUrl='http://localhost:5000/api/orders';

constructor(private http:HttpClient, private authService:AuthService){}

private getHeaders():HttpHeaders{
return this.authService.getAuthHeaders();
}

createOrder(data:any):Observable<any>{
return this.http.post(this.baseUrl,data,{headers:this.getHeaders()});
}

getUserOrders(userId:string):Observable<any>{
return this.http.get(`${this.baseUrl}/user/${userId}`,{headers:this.getHeaders()});
}

getOrderById(orderId:string):Observable<any>{
return this.http.get(`${this.baseUrl}/${orderId}`,{headers:this.getHeaders()});
}

getAllOrders():Observable<any>{
return this.http.get(this.baseUrl,{headers:this.getHeaders()});
}

updateOrderStatus(orderId:string,status:string):Observable<any>{
return this.http.put(`${this.baseUrl}/${orderId}/status`,{status},{headers:this.getHeaders()});
}

cancelOrder(orderId:string):Observable<any>{
return this.http.put(`${this.baseUrl}/${orderId}/cancel`,{},{headers:this.getHeaders()});
}
}