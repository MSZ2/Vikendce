import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CottageService } from '../services/cottage.service';

interface OwnerCottage {
  _id: string;
  name: string;
  location: string;
  coordinates?: { lat?: number; lng?: number };
  images?: string[];
  services?: string[];
  pricePerNight?: number;
  priceSummer: number;
  priceWinter: number;
  phone?: string;
  maxGuests?: number;
}

@Component({
  selector: 'app-owner-cottages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './owner-cottages.component.html',
  styleUrl: './owner-cottages.component.css'
})
export class OwnerCottagesComponent implements OnInit {
  cottages: OwnerCottage[] = [];
  editingId: string | null = null;
  editForm!: FormGroup;
  createForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  selectedImages: File[] = [];
  jsonError: string | null = null;

  constructor(private cottageService: CottageService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.initCreateForm();
    this.loadCottages();
  }

  initForm(): void {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      lat: [''],
      lng: [''],
      images: [''],
      services: [''],
      pricePerNight: [''],
      priceSummer: ['', Validators.required],
      priceWinter: ['', Validators.required],
      phone: [''],
      maxGuests: ['']
    });
  }

  initCreateForm(): void {
    this.createForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      services: [''],
      pricePerNight: [''],
      priceSummer: ['', Validators.required],
      priceWinter: ['', Validators.required],
      phone: [''],
      maxGuests: [''],
      lat: [''],
      lng: ['']
    });
  }

  loadCottages(): void {
    this.loading = true;
    this.error = null;
    this.cottageService.getOwnerCottages().subscribe({
      next: (res) => {
        this.cottages = res || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Грешка при учитавању викендица.';
        this.loading = false;
      }
    });
  }

  startEdit(cottage: OwnerCottage): void {
    this.editingId = cottage._id;
    this.success = null;
    this.error = null;
    this.editForm.reset({
      name: cottage.name || '',
      location: cottage.location || '',
      lat: cottage.coordinates?.lat ?? '',
      lng: cottage.coordinates?.lng ?? '',
      images: (cottage.images || []).join(', '),
      services: (cottage.services || []).join(', '),
      pricePerNight: cottage.pricePerNight ?? '',
      priceSummer: cottage.priceSummer ?? '',
      priceWinter: cottage.priceWinter ?? '',
      phone: cottage.phone ?? '',
      maxGuests: cottage.maxGuests ?? ''
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editForm.reset();
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedImages = input.files ? Array.from(input.files) : [];
  }

  onJsonSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if(!file) {
      this.jsonError = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        this.jsonError = null;
        this.createForm.patchValue({
          name: data.name ?? this.createForm.value.name,
          location: data.location ?? this.createForm.value.location,
          services: Array.isArray(data.services) ? data.services.join(', ') : (data.services ?? this.createForm.value.services),
          pricePerNight: data.pricePerNight ?? this.createForm.value.pricePerNight,
          priceSummer: data.priceSummer ?? this.createForm.value.priceSummer,
          priceWinter: data.priceWinter ?? this.createForm.value.priceWinter,
          phone: data.phone ?? this.createForm.value.phone,
          maxGuests: data.maxGuests ?? this.createForm.value.maxGuests,
          lat: data.coordinates?.lat ?? data.lat ?? this.createForm.value.lat,
          lng: data.coordinates?.lng ?? data.lng ?? this.createForm.value.lng
        });
      } catch (err) {
        console.error(err);
        this.jsonError = 'Учитавање JSON фајла није успело. Проверите формат.';
      }
    };
    reader.onerror = () => {
      this.jsonError = 'Учитавање JSON фајла није успело.';
    };
    reader.readAsText(file);
  }

  createCottage(): void {
    if(this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const formValue = this.createForm.value;
    const formData = new FormData();
    formData.append('name', formValue.name);
    formData.append('location', formValue.location);
    if(formValue.services) formData.append('services', formValue.services);
    if(formValue.pricePerNight !== '') formData.append('pricePerNight', formValue.pricePerNight);
    formData.append('priceSummer', formValue.priceSummer);
    formData.append('priceWinter', formValue.priceWinter);
    if(formValue.phone) formData.append('phone', formValue.phone);
    if(formValue.maxGuests !== '') formData.append('maxGuests', formValue.maxGuests);
    if(formValue.lat !== '') formData.append('lat', formValue.lat);
    if(formValue.lng !== '') formData.append('lng', formValue.lng);
    this.selectedImages.forEach(file => formData.append('images', file));

    this.loading = true;
    this.cottageService.createCottage(formData).subscribe({
      next: (created) => {
        this.success = 'Викендица је успешно додата.';
        this.loading = false;
        this.cottages = [created, ...this.cottages];
        this.resetCreateForm();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Додавање није успело.';
        this.loading = false;
      }
    });
  }

  private resetCreateForm(): void {
    this.createForm.reset();
    this.selectedImages = [];
    this.jsonError = null;
  }

  saveChanges(): void {
    if(!this.editingId || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValue = this.editForm.value;
    const payload: any = {
      name: formValue.name,
      location: formValue.location,
      coordinates: (formValue.lat !== '' || formValue.lng !== '') ? {
        lat: formValue.lat === '' ? null : Number(formValue.lat),
        lng: formValue.lng === '' ? null : Number(formValue.lng)
      } : null,
      images: this.transformToArray(formValue.images),
      services: this.transformToArray(formValue.services),
      pricePerNight: formValue.pricePerNight === '' ? '' : Number(formValue.pricePerNight),
      priceSummer: Number(formValue.priceSummer),
      priceWinter: Number(formValue.priceWinter),
      phone: formValue.phone,
      maxGuests: formValue.maxGuests === '' ? '' : Number(formValue.maxGuests)
    };

    this.loading = true;
    this.cottageService.updateCottage(this.editingId, payload).subscribe({
      next: (updated) => {
        this.success = 'Подаци су успешно сачувани.';
        this.loading = false;
        this.editingId = null;
        this.updateLocalList(updated);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Измена није успела.';
        this.loading = false;
      }
    });
  }

  deleteCottage(cottage: OwnerCottage): void {
    const confirmed = confirm(`Да ли сте сигурни да желите да обришете викендицу "${cottage.name}"?`);
    if(!confirmed) return;

    this.loading = true;
    this.cottageService.deleteCottage(cottage._id).subscribe({
      next: (res) => {
        this.success = res?.message || 'Викендица је обрисана.';
        this.loading = false;
        this.cottages = this.cottages.filter(c => c._id !== cottage._id);
        if(this.editingId === cottage._id) {
          this.editingId = null;
        }
      },
      error: (err) => {
        this.error = err?.error?.message || 'Брисање није успело.';
        this.loading = false;
      }
    });
  }

  private transformToArray(value: string): string[] {
    return value
      .split(/[,;\n]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  private updateLocalList(updated: OwnerCottage): void {
    this.cottages = this.cottages.map(c => (c._id === updated._id ? updated : c));
  }
}
