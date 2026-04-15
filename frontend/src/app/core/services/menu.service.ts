import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  // Use relative path — Angular proxy routes /api → http://localhost:3000
  private baseUrl = '/api/menu';

  constructor(private http: HttpClient) {}

  getAllMenu(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  getMenuByRestaurant(restaurantId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/restaurant/${restaurantId}`);
  }

  searchMenu(search: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/search?search=${search}`);
  }

  getMenuItem(menuId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${menuId}`);
  }

  createMenuItem(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  updateMenuItem(menuId: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${menuId}`, data);
  }

  deleteMenuItem(menuId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${menuId}`);
  }
}