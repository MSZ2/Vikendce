
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean {
    const token = this.auth.getToken();
    const user = this.auth.getUser();
    console.log('AdminGuard check:', user);
    if (token && user.role === 'admin') {
      //this.router.navigate(['/admin']); 
      return true; // pusti admina na rutu
    } else {
      this.router.navigate(['/']); // prebaci na admin login ako nije admin
      return false;
    }
   
  }
}
