// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
//import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { RegisterComponent } from './register/register.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminGuard } from './guards/admin.guard';
//import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Public route
  { path: 'login', component: LoginComponent },
  { path: 'admin-login', component: AdminLoginComponent },
  { path: 'register', component: RegisterComponent},

  // Protected routes
  //{ path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },

  // Admin only
  { path: 'admin', component: AdminUsersComponent, canActivate: [AdminGuard] },

  // Wildcard / 404
  { path: '**', redirectTo: 'login' },
];
