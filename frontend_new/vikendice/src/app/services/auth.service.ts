import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:4000/api/auth';
  private usersApi = 'http://localhost:4000/api/users';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.api}/login`, { username, password }).pipe(
      tap((res: any) => {
        if(res && res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  adminLogin(username: string, password: string) {
    return this.http.post(`${this.api}/admin/login`, { username, password }).pipe(
      tap((res: any) => {
        if(res && res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
  }

  fetchCurrentUser(): Observable<any> {
    return this.http.get(`${this.usersApi}/me`).pipe(
      tap((res: any) => {
        if(res) {
          localStorage.setItem('user', JSON.stringify(res));
        }
      })
    );
  }

  isLoggedIn() {
    return !!this.getToken();
  }
}
