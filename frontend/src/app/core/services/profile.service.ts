import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  // Use relative path — Angular proxy routes /api → http://localhost:3000
  private baseUrl = '/api/users';

  constructor(private http: HttpClient) {}

  getUser(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}