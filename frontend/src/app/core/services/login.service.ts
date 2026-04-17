import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  // Use relative path — Angular proxy routes /api → http://localhost:3000
  private baseUrl = '/api/auth';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Login requires: { email, password, role }
  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  // Routes to the correct endpoint based on the role field
  register(data: any): Observable<any> {
    const endpoint =
      data.role === 'Owner'         ? 'register/owner'    :
      data.role === 'DeliveryAgent' ? 'register/agent'    :
                                     'register/customer';
    return this.http.post(`${this.baseUrl}/${endpoint}`, data);
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('ownerRestaurantId');
    sessionStorage.removeItem('ownerRestaurantName');
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}