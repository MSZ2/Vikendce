// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
//import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { RegisterComponent } from './register/register.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminGuard } from './guards/admin.guard';
import { HomeComponent } from './home/home.component';
import { CottageDetailComponent } from './cottage-detail/cottage-detail.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
//import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  
  { path: '', component: HomeComponent },
  { path: 'cottages/:id', component: CottageDetailComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: UserProfileComponent, canActivate: [AuthGuard] },

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
