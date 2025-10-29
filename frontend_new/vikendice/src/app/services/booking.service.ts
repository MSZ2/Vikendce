import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private api = 'http://localhost:4000/api/bookings';

  constructor(private http: HttpClient) {}

  getMyBookings(): Observable<any> {
    return this.http.get(`${this.api}/me`);
  }

  getOwnerReservations(): Observable<any> {
    return this.http.get(`${this.api}/owner`);
  }

  cancelBooking(id: string): Observable<any> {
    return this.http.patch(`${this.api}/${id}/cancel`, {});
  }

  updateBookingStatus(id: string, action: 'approve' | 'reject', comment?: string): Observable<any> {
    return this.http.patch(`${this.api}/${id}/status`, { action, comment });
  }

  submitReview(id: string, payload: { rating: number; comment?: string }): Observable<any> {
    return this.http.post(`${this.api}/${id}/review`, payload);
  }
}
