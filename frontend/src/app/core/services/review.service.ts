import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReviewService {

  private base = '/api/reviews';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ 'x-auth-token': token });
  }

  /** Submit a review for a delivered order */
  submitReview(orderId: string, rating: number, comment: string): Observable<any> {
    return this.http.post(this.base, { orderId, rating, comment },
      { headers: this.getHeaders() });
  }

  /** Check if a review already exists for a specific order */
  getReviewByOrder(orderId: string): Observable<any> {
    return this.http.get(`${this.base}/order/${orderId}`,
      { headers: this.getHeaders() });
  }

  /** Get all reviews for a restaurant */
  getReviewsByRestaurant(restaurantId: string): Observable<any> {
    return this.http.get(`${this.base}/${restaurantId}`,
      { headers: this.getHeaders() });
  }
}
