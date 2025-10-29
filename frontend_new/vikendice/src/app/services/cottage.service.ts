import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CottageService {
  private api = 'http://localhost:4000/api/cottage';
  constructor(private http: HttpClient) { }
  getCottageDetails(id: string): Observable<any> {
    return this.http.get(`${this.api}/${id}`);
  }

  scheduleBooking(id: string, payload: any): Observable<any> {
    return this.http.post(`${this.api}/${id}/bookings`, payload);
  }
}
