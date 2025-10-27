import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
    registerForm: FormGroup;
    constructor(private fb: FormBuilder, private http: HttpClient) {
      this.registerForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['М', Validators.required],
      address: [''],
      phone: [''],
      email: ['', [Validators.required, Validators.email]],
      cardNumber: [''],
      role: ['tourist', Validators.required],
    });
    }
    cardType: string | null = null;
    selectedFile: File | null = null;





    onFileSelected(e: any) {
      this.selectedFile = e.target.files[0];
    }

    onCardChange() {
      const num = this.registerForm.get('cardNumber')?.value || '';
      const cleaned = num.replace(/\D/g, '');
      if (/^(300|301|302|303|36|38)\d{12}$/.test(cleaned)) this.cardType = 'diners';
      else if (/^(51|52|53|54|55)\d{14}$/.test(cleaned)) this.cardType = 'mastercard';
      else if (/^(4539|4556|4916|4532|4929|4485|4716)\d{12}$/.test(cleaned)) this.cardType = 'visa';
      else this.cardType = null;
    }

    onSubmit() {
      const formData = new FormData();
      Object.entries(this.registerForm.value).forEach(([k, v]) => formData.append(k, String(v) || ''));
      if (this.selectedFile) formData.append('profileImage', this.selectedFile);

      this.http.post('http://localhost:4000/api/auth/register', formData).subscribe({
        next: res => alert('Захтев успешно послат!'),
        error: err => alert(err.error.message || 'Грешка при регистрацији.')
      });
    }
}
