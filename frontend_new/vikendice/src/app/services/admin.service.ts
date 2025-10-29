import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private api = 'http://localhost:4000/api/admin';

  constructor(private http: HttpClient) {}
  getAllUsers() {
    return this.http.get<any>(`${this.api}/users`);
  }

  updateUserStatus(id: string, status: string, reason?: string) {
    return this.http.patch(`${this.api}/users/${id}/status`, { status, reason });
  }

  createUser(payload: any) {
    return this.http.post(`${this.api}/users`, payload);
  }

  updateUser(id: string, payload: any) {
    return this.http.put(`${this.api}/users/${id}`, payload);
  }

  deleteUser(id: string) {
    return this.http.delete(`${this.api}/users/${id}`);
  }

  getAdminCottages() {
    return this.http.get<any>(`http://localhost:4000/api/cottage/admin`);
  }

  blockCottage(id: string) {
    return this.http.patch(`http://localhost:4000/api/cottage/${id}/block`, {});
  }
}
