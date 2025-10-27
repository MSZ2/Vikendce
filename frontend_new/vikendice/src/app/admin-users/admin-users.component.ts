import { Component, OnInit } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];

  constructor(private adminService: AdminService) {}
  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe(users => (this.users = users));
  }

  changeStatus(userId: string, newStatus: string) {
    this.adminService.updateUserStatus(userId, newStatus).subscribe(() => this.loadUsers());
  }

}
