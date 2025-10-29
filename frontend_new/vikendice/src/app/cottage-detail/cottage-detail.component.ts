import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CottageService } from '../services/cottage.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-cottage-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cottage-detail.component.html',
  styleUrl: './cottage-detail.component.css'
})
export class CottageDetailComponent implements OnInit {
    cottage: any;
  reviews: any[] = [];
  avgRating: number | null = null;
  mapUrl: SafeResourceUrl | null = null;
  stars = [0, 1, 2, 3, 4];
  bookingForm!: FormGroup;
  currentStep = 1;
  nightsCount = 0;
  calculatedPrice = 0;
  bookingError: string | null = null;
  bookingSuccess: string | null = null;
  isSubmitting = false;
  user: any;
  canMakeReservation = false;

  constructor(
    private route: ActivatedRoute,
    private cottageService: CottageService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    console.log('Cottage ID from route:', id);
    this.cottageService.getCottageDetails(id).subscribe(res => {
      this.cottage = res.cottage;
      this.reviews = res.reviews;
      this.avgRating = res.avgRating;
      this.mapUrl = this.buildMapUrl(this.cottage);
      this.evaluateBookingPermission();
    });

    this.user = this.authService.getUser();
    if(this.user) {
      this.initializeBookingForm(this.user.cardNumber);
      this.evaluateBookingPermission();
    } else {
      this.initializeBookingForm('');
    }

    if(this.authService.getToken()) {
      this.authService.fetchCurrentUser().subscribe({
        next: (res) => {
          this.user = res;
          if(this.bookingForm) {
            this.bookingForm.patchValue({ cardNumber: res?.cardNumber || '' });
          }
          this.evaluateBookingPermission();
        },
        error: (err) => {
          console.error('Неуспело учитавање корисника', err);
        }
      });
    }
  }

  getStarClass(index: number, rating: number | null | undefined): string {
    if(rating === null || rating === undefined) {
      return 'empty';
    }
    if(rating >= index + 1) {
      return 'filled';
    }
    if(rating >= index + 0.5) {
      return 'half';
    }
    return 'empty';
  }

  private buildMapUrl(cottage: any): SafeResourceUrl | null {
    if(!cottage) {
      return null;
    }

    if(cottage.coordinates && cottage.coordinates.lat && cottage.coordinates.lng) {
      const { lat, lng } = cottage.coordinates;
      const url = `https://www.google.com/maps?q=${lat},${lng}&z=13&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    if(cottage.location) {
      const query = encodeURIComponent(cottage.location);
      const url = `https://www.google.com/maps?q=${query}&z=12&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    return null;
  }

  private initializeBookingForm(cardNumber: string) {
    this.bookingForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      adults: [1, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.min(0)]],
      cardNumber: [cardNumber || '', [Validators.required]],
      note: ['', [Validators.maxLength(500)]]
    });
  }

  goToStep(step: number) {
    if(step === 2) {
      this.prepareStepTwo();
      return;
    }
    this.bookingError = null;
    this.bookingSuccess = null;
    this.currentStep = 1;
  }

  private prepareStepTwo() {
    this.bookingError = null;
    this.bookingSuccess = null;
    if(!this.bookingForm) {
      return;
    }

    const { startDate, endDate, adults, children, note } = this.bookingForm.value;

    if(!startDate || !endDate) {
      this.bookingError = 'Потребно је да унесете оба датума.';
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if(Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      this.bookingError = 'Унети датуми нису у исправном формату.';
      return;
    }

    if(end <= start) {
      this.bookingError = 'Датум одјаве мора бити после датума пријаве.';
      return;
    }

    if(start < new Date()) {
      this.bookingError = 'Не можете заказати термин у прошлости.';
      return;
    }

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    if(startMinutes < 14 * 60) {
      this.bookingError = 'Улазак је могућ најраније у 14:00.';
      return;
    }

    const endMinutes = end.getHours() * 60 + end.getMinutes();
    if(endMinutes > 10 * 60) {
      this.bookingError = 'Излазак мора бити најкасније до 10:00.';
      return;
    }

    const adultsCount = Number(adults) || 0;
    const childrenCount = Number(children) || 0;
    if(adultsCount <= 0) {
      this.bookingError = 'Број одраслих мора бити најмање 1.';
      return;
    }

    if(childrenCount < 0) {
      this.bookingError = 'Број деце не може бити негативан.';
      return;
    }

    if(note && note.length > 500) {
      this.bookingError = 'Напомена може имати највише 500 карактера.';
      return;
    }

    const diffMs = end.getTime() - start.getTime();
    this.nightsCount = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    if(this.nightsCount <= 0) {
      this.bookingError = 'Потребно је бар једно ноћење.';
      return;
    }

    const totalGuests = adultsCount + childrenCount;
    if(this.cottage?.maxGuests && totalGuests > this.cottage.maxGuests) {
      this.bookingError = `Максимални капацитет је ${this.cottage.maxGuests} гостију.`;
      return;
    }

    this.calculatedPrice = this.calculatePrice(start, this.nightsCount);
    this.bookingError = null;
    this.currentStep = 2;
  }

  submitBooking() {
    if(!this.bookingForm || !this.cottage) {
      return;
    }

    const { startDate, endDate, adults, children, cardNumber, note } = this.bookingForm.value;
    const sanitizedCard = (cardNumber || '').replace(/\D/g, '');

    if(!sanitizedCard || sanitizedCard.length < 12 || sanitizedCard.length > 19) {
      this.bookingError = 'Број картице мора имати између 12 и 19 цифара.';
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const adultsCount = Number(adults) || 0;
    const childrenCount = Number(children) || 0;

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    if(startMinutes < 14 * 60) {
      this.bookingError = 'Улазак је могућ најраније у 14:00.';
      return;
    }

    const endMinutes = end.getHours() * 60 + end.getMinutes();
    if(endMinutes > 10 * 60) {
      this.bookingError = 'Излазак мора бити најкасније до 10:00.';
      return;
    }

    this.isSubmitting = true;
    this.bookingError = null;
    this.bookingSuccess = null;

    const payload: any = {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      adults: adultsCount,
      children: childrenCount,
      cardNumber: sanitizedCard,
      totalPrice: this.calculatedPrice
    };

    const trimmedNote = (note || '').trim();
    if(trimmedNote) {
      payload.note = trimmedNote;
    }

    this.cottageService.scheduleBooking(this.cottage._id, payload).subscribe({
      next: (res) => {
        this.bookingSuccess = res?.message || 'Термин је успешно заказан.';
        this.isSubmitting = false;
        this.currentStep = 1;
        this.bookingForm.reset({
          startDate: '',
          endDate: '',
          adults: 1,
          children: 0,
          cardNumber: this.user?.cardNumber || '',
          note: ''
        });
        this.nightsCount = 0;
        this.calculatedPrice = 0;
      },
      error: (err) => {
        this.bookingError = err?.error?.message || 'Дошло је до грешке приликом заказивања.';
        this.isSubmitting = false;
      }
    });
  }

  private evaluateBookingPermission() {
    this.canMakeReservation = !!(this.user && this.user.role === 'tourist');
  }

  private calculatePrice(startDate: Date, nights: number): number {
    if(!this.cottage) {
      return 0;
    }

    let total = 0;
    for(let i = 0; i < nights; i++) {
      const nightDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      total += this.getNightlyRate(nightDate);
    }
    return Math.round(total * 100) / 100;
  }

  private getNightlyRate(date: Date): number {
    if(this.cottage?.pricePerNight) {
      return this.cottage.pricePerNight;
    }

    const month = date.getMonth() + 1;
    const isSummer = [6, 7, 8].includes(month);
    const isWinter = [12, 1, 2].includes(month);

    if(isSummer && this.cottage?.priceSummer) {
      return this.cottage.priceSummer;
    }

    if(isWinter && this.cottage?.priceWinter) {
      return this.cottage.priceWinter;
    }

    if(this.cottage?.priceSummer && this.cottage?.priceWinter) {
      return Math.round(((this.cottage.priceSummer + this.cottage.priceWinter) / 2) * 100) / 100;
    }

    return this.cottage?.priceSummer || this.cottage?.priceWinter || 0;
  }
}
