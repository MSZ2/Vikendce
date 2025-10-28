import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  constructor( private http: HttpClient) {}
  private api = 'http://localhost:4000/api';
 
  getStats(): Observable<any> { return this.http.get(`${this.api}/home/stats`); }

  searchCottages(name?: string, location?: string, sortBy?: string, sortOrder?: 'asc'|'desc'): Observable<any> {
    let params = new HttpParams();
    if(name) params=params.set('name',name);
    if(location) params=params.set('location',location);
    if(sortBy) params=params.set('sortBy',sortBy);
    if(sortOrder) params=params.set('sortOrder',sortOrder);
    return this.http.get(`${this.api}/cottage`,{ params });
  }
}
