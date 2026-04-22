import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Use relative path — Angular proxy routes /api → http://localhost:3000
  private baseUrl = '/api/auth';

  constructor(private http: HttpClient) {}

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

  // ✅ Check if user is logged in
  isLoggedIn(): boolean {
    const user  = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    return !!(user && token);
  }

  // ✅ Get current user from localStorage
  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // ✅ Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // ✅ Returns HttpHeaders with Authorization token attached
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken() || '';
    return new HttpHeaders({ 'x-auth-token': token });
  }

  // ✅ Logout user — removes BOTH user and token, clears any cached session state
  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('selectedCity');           // clear city filter for next user
    // Clear owner session state so a new login gets a clean slate
    sessionStorage.removeItem('ownerRestaurantId');
    sessionStorage.removeItem('ownerRestaurantName');
    sessionStorage.removeItem('lastOrderId');
  }

  // ✅ Save user and token (called after successful login)
  saveUserAndToken(user: any, token: string): void {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  }
}