import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  styleUrls: ['./admin-login.component.css'],
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html'
})
export class AdminLoginComponent {
  form: FormGroup;
  error: string | null = null;
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  submit() {
    if(this.form.invalid) return;
    this.loading = true;
    this.error = null;
    const { username, password } = this.form.value;
    this.auth.adminLogin(username, password).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/admin']); },
      error: (err) => { this.loading = false; this.error = err.error?.message || 'Greška pri пријави'; }
    });
  }
}
