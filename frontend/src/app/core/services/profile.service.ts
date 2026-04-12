import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
providedIn:'root'
})
export class ProfileService{

private baseUrl='http://localhost:5000/api/users';

constructor(private http:HttpClient){}

getUser(id:string):Observable<any>{
return this.http.get(`${this.baseUrl}/${id}`);
}

updateUser(id:string,data:any):Observable<any>{
return this.http.put(`${this.baseUrl}/${id}`,data);
}

deleteUser(id:string):Observable<any>{
return this.http.delete(`${this.baseUrl}/${id}`);
}
}