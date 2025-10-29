import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../services/admin.service';

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: 'owner' | 'tourist';
  status: 'pending' | 'approved' | 'rejected';
  firstName?: string;
  lastName?: string;
  gender?: string;
  address?: string;
  phone?: string;
}

interface AdminCottage {
  _id: string;
  name: string;
  location: string;
  owner?: { username?: string; email?: string };
  recentRatings?: number[];
  lowRated?: boolean;
  blockedUntil?: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  owners: AdminUser[] = [];
  tourists: AdminUser[] = [];
  pending: AdminUser[] = [];
  cottages: AdminCottage[] = [];

  createForm!: FormGroup;
  editForm!: FormGroup;
  editingUserId: string | null = null;

  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private adminService: AdminService, private fb: FormBuilder) {}
  ngOnInit() {
    this.initForms();
    this.loadUsers();
  }

  initForms() {
    this.createForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['M', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      phone: [''],
      role: ['owner', Validators.required],
      status: ['approved', Validators.required]
    });

    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['M', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      phone: [''],
      role: ['owner', Validators.required]
    });
  }

  loadUsers() {
    this.loading = true;
    this.error = null;
    this.editingUserId = null;
    this.adminService.getAllUsers().subscribe({
      next: (res) => {
        this.owners = res?.owners ?? [];
        this.tourists = res?.tourists ?? [];
        this.pending = res?.pending ?? [];
        this.loading = false;
        this.loadCottages();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Грешка при учитавању корисника';
        this.loading = false;
      }
    });
  }

  loadCottages(): void {
    this.adminService.getAdminCottages().subscribe({
      next: (res) => {
        this.cottages = res ?? [];
      },
      error: (err) => {
        this.error = err?.error?.message || 'Грешка при учитавању викендица';
      }
    });
  }

  changeStatus(userId: string, newStatus: string) {
    let reason: string | undefined;
    if(newStatus === 'rejected') {
      reason = prompt('Унесите разлог одбијања (опционо):') || undefined;
    }
    this.loading = true;
    this.adminService.updateUserStatus(userId, newStatus, reason).subscribe({
      next: () => {
        this.success = 'Статус је ажуриран';
        this.loadUsers();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Ажурирање статуса није успело';
        this.loading = false;
      }
    });
  }

  submitCreate(): void {
    if(this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    this.adminService.createUser(this.createForm.value).subscribe({
      next: () => {
        this.success = 'Корисник је додат.';
        this.createForm.reset({ gender: 'M', role: 'owner', status: 'approved' });
        this.loadUsers();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Додавање није успело';
        this.loading = false;
      }
    });
  }

  startEdit(user: AdminUser): void {
    this.editingUserId = user._id;
    this.editForm.reset({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      gender: user.gender || 'M',
      email: user.email || '',
      address: user.address || '',
      phone: user.phone || '',
      role: user.role
    });
  }

  cancelEdit(): void {
    this.editingUserId = null;
  }

  saveEdit(user: AdminUser): void {
    if(this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.adminService.updateUser(user._id, this.editForm.value).subscribe({
      next: () => {
        this.success = 'Подаци су ажурирани.';
        this.editingUserId = null;
        this.loadUsers();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Измена није успела';
        this.loading = false;
      }
    });
  }

  removeUser(user: AdminUser): void {
    const confirmed = confirm(`Обриши корисника ${user.username}?`);
    if(!confirmed) return;

    this.adminService.deleteUser(user._id).subscribe({
      next: () => {
        this.success = 'Корисник је обрисан.';
        this.loadUsers();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Брисање није успело';
      }
    });
  }

  blockCottage(cottage: AdminCottage): void {
    const confirmed = confirm(`Привремено блокирати викендицу "${cottage.name}" на 48 сати?`);
    if(!confirmed) return;

    this.adminService.blockCottage(cottage._id).subscribe({
      next: (res) => {
        this.success = (res as any)?.message || 'Викендица је блокирана.';
        this.loadCottages();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Блокирање није успело';
      }
    });
  }
}
