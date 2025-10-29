import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Vikendice';

  constructor(private auth: AuthService, private router: Router) {}

  get isAuthenticated(): boolean {
    return !!this.auth.getToken();
  }

  get isTourist(): boolean {
    const user = this.auth.getUser();
    return user?.role === 'tourist';
  }

  get isOwner(): boolean {
    const user = this.auth.getUser();
    return user?.role === 'owner';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
