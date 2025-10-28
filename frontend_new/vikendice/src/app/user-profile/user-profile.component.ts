import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {
   profileForm!: FormGroup;
  user: any;
  selectedFile: File | null = null;
  showCardNumber = false;

  private api = 'http://localhost:4000/api/users';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();

    // prikaži polje za kreditnu karticu samo za turiste
    this.showCardNumber = this.user.role === 'tourist';

    this.profileForm = this.fb.group({
      firstName: [this.user.firstName],
      lastName: [this.user.lastName],
      address: [this.user.address],
      email: [this.user.email],
      phone: [this.user.phone],
      cardNumber: [this.user.cardNumber] // neće se prikazivati za vlasnika
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
  }

  onSubmit() {
    const formData = new FormData();
    Object.keys(this.profileForm.value).forEach(key => {
      if(key !== 'cardNumber' || this.showCardNumber) { 
        formData.append(key, this.profileForm.value[key]);
      }
    });

    if(this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }

    this.http.put(`${this.api}/me`, formData).pipe(
      tap((res: any) => {
        localStorage.setItem('user', JSON.stringify(res));
        this.user = res;
        alert('Profil uspešno ažuriran!');
      })
    ).subscribe();
  }

}
