import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Restaurant, Menu, Cart, Order, DeliveryAgent } from '../../shared/models/index';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }

  // User endpoints
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, user);
  }

  loginUser(email: string, password: string, role: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users/login`, { email, password, role });
  }

  updateUser(id: string, user: User): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, user);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`);
  }

  // Restaurant endpoints
  getRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.baseUrl}/restaurants`);
  }

  getRestaurantById(id: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.baseUrl}/restaurants/${id}`);
  }

  createRestaurant(restaurant: Restaurant): Observable<Restaurant> {
    return this.http.post<Restaurant>(`${this.baseUrl}/restaurants`, restaurant);
  }

  updateRestaurant(id: string, restaurant: Restaurant): Observable<Restaurant> {
    return this.http.put<Restaurant>(`${this.baseUrl}/restaurants/${id}`, restaurant);
  }

  deleteRestaurant(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/restaurants/${id}`);
  }

  // Menu endpoints
  getMenus(): Observable<Menu[]> {
    return this.http.get<Menu[]>(`${this.baseUrl}/menu`);
  }

  getMenuById(id: string): Observable<Menu> {
    return this.http.get<Menu>(`${this.baseUrl}/menu/${id}`);
  }

  getMenusByRestaurant(restaurantId: string): Observable<Menu[]> {
    return this.http.get<Menu[]>(`${this.baseUrl}/menu?restaurantId=${restaurantId}`);
  }

  createMenu(menu: Menu): Observable<Menu> {
    return this.http.post<Menu>(`${this.baseUrl}/menu`, menu);
  }

  updateMenu(id: string, menu: Menu): Observable<Menu> {
    return this.http.put<Menu>(`${this.baseUrl}/menu/${id}`, menu);
  }

  deleteMenu(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/menu/${id}`);
  }

  // Cart endpoints
  getCarts(userId?: string): Observable<Cart[]> {
    const url = userId ? `${this.baseUrl}/cart?userId=${userId}` : `${this.baseUrl}/cart`;
    return this.http.get<Cart[]>(url);
  }

  getCartById(id: string): Observable<Cart> {
    return this.http.get<Cart>(`${this.baseUrl}/cart/${id}`);
  }

  createCart(cart: any): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/cart`, cart);
  }

  updateCart(id: string, cart: Cart): Observable<Cart> {
    return this.http.put<Cart>(`${this.baseUrl}/cart/${id}`, cart);
  }

  deleteCart(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/${id}`);
  }

  // Order endpoints
  getOrders(userId?: string): Observable<Order[]> {
    const url = userId ? `${this.baseUrl}/orders?userId=${userId}` : `${this.baseUrl}/orders`;
    return this.http.get<Order[]>(url);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${id}`);
  }

  createOrder(order: any): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, order);
  }

  updateOrder(id: string, order: Order): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/orders/${id}`, order);
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/orders/${id}`);
  }

  // Delivery Agent endpoints
  getDeliveryAgents(): Observable<DeliveryAgent[]> {
    return this.http.get<DeliveryAgent[]>(`${this.baseUrl}/delivery`);
  }

  getDeliveryAgentById(id: string): Observable<DeliveryAgent> {
    return this.http.get<DeliveryAgent>(`${this.baseUrl}/delivery/${id}`);
  }

  createDeliveryAgent(agent: DeliveryAgent): Observable<DeliveryAgent> {
    return this.http.post<DeliveryAgent>(`${this.baseUrl}/delivery`, agent);
  }

  updateDeliveryAgent(id: string, agent: DeliveryAgent): Observable<DeliveryAgent> {
    return this.http.put<DeliveryAgent>(`${this.baseUrl}/delivery/${id}`, agent);
  }

  deleteDeliveryAgent(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delivery/${id}`);
  }
}