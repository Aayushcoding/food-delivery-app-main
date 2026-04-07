import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User } from '../../shared/models/index';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());
  private currentUser = new BehaviorSubject<User | null>(this.getStoredUser());

  constructor(private apiService: ApiService) { }

  login(email: string, password: string, role: string): Observable<User> {
    return this.apiService.loginUser(email, password, role).pipe(
      map((response: any) => {
        const { token, user } = response;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.isLoggedIn.next(true);
        this.currentUser.next(user);
        return user;
      }),
      catchError(err => throwError(() => err))
    );
  }

  register(userData: any): Observable<User> {
    return this.apiService.createUser(userData).pipe(
      map((user: User) => {
        // Don't set token on registration - user needs to login after registration
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser.next(user);
        return user;
      }),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedIn.next(false);
    this.currentUser.next(null);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isLoggedIn.asObservable();
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  getCurrentUserValue(): User | null {
    return this.currentUser.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
