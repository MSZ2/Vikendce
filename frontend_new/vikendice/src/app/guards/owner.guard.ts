import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class OwnerGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.auth.getToken();
    const user = this.auth.getUser();

    if(token && user?.role === 'owner') {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
