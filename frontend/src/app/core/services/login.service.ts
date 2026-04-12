import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
providedIn:'root'
})
export class LoginService{

private baseUrl='http://localhost:5000/api/auth';

constructor(private http:HttpClient){}

login(data:any):Observable<any>{
// Send login request to backend
return this.http.post(`${this.baseUrl}/login`,data);
}

register(data:any):Observable<any>{
// Determine which register endpoint to use based on role
const endpoint=data.role==='Owner'?'register/owner':'register/customer';
return this.http.post(`${this.baseUrl}/${endpoint}`,data);
}

registerCustomer(data:any):Observable<any>{
return this.http.post(`${this.baseUrl}/register/customer`,data);
}

registerOwner(data:any):Observable<any>{
return this.http.post(`${this.baseUrl}/register/owner`,data);
}

logout():void{
localStorage.removeItem('user');
localStorage.removeItem('token');
}

getCurrentUser():any{
const userStr=localStorage.getItem('user');
return userStr?JSON.parse(userStr):null;
}

isLoggedIn():boolean{
return!!localStorage.getItem('user');
}
}