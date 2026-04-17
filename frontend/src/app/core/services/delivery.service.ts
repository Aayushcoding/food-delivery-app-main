import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AgentOrderStatus = 'picked_up' | 'on_the_way' | 'arriving' | 'delivered';

@Injectable({ providedIn: 'root' })
export class DeliveryService {

  private base = '/api/delivery';

  constructor(private http: HttpClient) {}

  /** All delivery agents */
  getAgents(): Observable<any> {
    return this.http.get(`${this.base}`);
  }

  /**
   * Available orders: out_for_delivery with no agent assigned yet.
   * Backend also auto-clears 30-min timeout on this call.
   */
  getAvailableOrders(): Observable<any> {
    return this.http.get(`${this.base}/orders/available`);
  }

  /** Orders currently assigned to a specific agent (not yet delivered) */
  getMyActiveOrders(agentId: string): Observable<any> {
    return this.http.get(`${this.base}/${agentId}/orders`);
  }

  /**
   * Agent accepts an order.
   * Sets deliveryAgentId + acceptedAt on the order.
   * 30-min pickup window starts from acceptedAt.
   */
  assignOrder(orderId: string, agentId: string): Observable<any> {
    return this.http.post(`${this.base}/assign/${orderId}`, { agentId });
  }

  /**
   * Agent rejects / ignores an order.
   * Clears deliveryAgentId — order goes back to available pool.
   */
  rejectOrder(orderId: string, agentId: string): Observable<any> {
    return this.http.post(`${this.base}/reject/${orderId}`, { agentId });
  }

  /**
   * Agent progresses delivery status.
   * Valid steps: picked_up → on_the_way → arriving → delivered
   */
  updateOrderStatus(agentId: string, orderId: string, status: AgentOrderStatus): Observable<any> {
    return this.http.put(`${this.base}/${agentId}/orders/${orderId}/status`, { status });
  }

  /** Update agent availability */
  updateAvailability(agentId: string, isAvailable: boolean): Observable<any> {
    return this.http.put(`${this.base}/${agentId}`, { isAvailable });
  }

  /** Register a new delivery agent */
  registerAgent(data: any): Observable<any> {
    return this.http.post('/api/auth/register/delivery', data);
  }
}
