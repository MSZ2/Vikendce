import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private api = 'http://localhost:4000/api/admin';

  constructor(private http: HttpClient) {}
  getAllUsers() {
    return this.http.get<any[]>(`${this.api}/users`);
  }

  updateUserStatus(id: string, status: string) {
    return this.http.put(`${this.api}/users/${id}/status`, { status });
  }
}
