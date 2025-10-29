import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../services/booking.service';
import { AuthService } from '../services/auth.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import srLocale from '@fullcalendar/core/locales/sr';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

interface BookingModel {
  _id: string;
  startDate: string;
  endDate: string;
  status: string;
  cottage?: {
    _id: string;
    name: string;
    location: string;
  };
  comment?: string;
  rating?: number;
  canCancel?: boolean;
  canReview?: boolean;
  ownerComment?: string;
}

interface ReviewState {
  rating: number;
  comment: string;
  submitting: boolean;
  error: string | null;
}

interface OwnerBooking extends BookingModel {
  tourist?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  createdAt?: string;
  note?: string;
  totalPrice?: number;
}

interface DecisionState {
  comment: string;
  submitting: boolean;
  error: string | null;
}

interface CalendarBookingEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  cottage?: OwnerBooking['cottage'];
  tourist?: OwnerBooking['tourist'];
  note?: string;
  totalPrice?: number;
}

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css'
})
export class ReservationsComponent implements OnInit {
  role: 'tourist' | 'owner' | null = null;

  loading = false;
  error: string | null = null;
  success: string | null = null;

  // Tourist state
  currentBookings: BookingModel[] = [];
  historyBookings: BookingModel[] = [];
  reviewState: Record<string, ReviewState> = {};
  openReviewId: string | null = null;
  stars = [1, 2, 3, 4, 5];

  // Owner state
  pendingRequests: OwnerBooking[] = [];
  decisionState: Record<string, DecisionState> = {};
  calendarOptions: CalendarOptions = {};
  calendarEvents: CalendarBookingEvent[] = [];
  selectedEvent: CalendarBookingEvent | null = null;

  constructor(private bookingService: BookingService, private auth: AuthService) {}

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.role = user?.role === 'owner' ? 'owner' : 'tourist';
    this.initializeCalendar();
    this.loadBookings();
  }

  private initializeCalendar(): void {
    this.calendarOptions = {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: ''
      },
      height: 'auto',
      events: [],
      eventClick: (arg: EventClickArg) => this.onEventClick(arg),
      locales: [srLocale],
      locale: 'sr'
    };
  }

  loadBookings(): void {
    this.loading = true;
    this.error = null;
    this.success = null;

    if(this.role === 'owner') {
      this.bookingService.getOwnerReservations().subscribe({
        next: (res) => {
          this.pendingRequests = res.pending ?? [];
          this.calendarEvents = res.calendar ?? [];
          this.decisionState = {};
          this.selectedEvent = null;
          this.updateCalendar();
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Дошло је до грешке при учитавању резервација.';
          this.loading = false;
        }
      });
    } else {
      this.bookingService.getMyBookings().subscribe({
        next: (res) => {
          this.currentBookings = res.current ?? [];
          this.historyBookings = res.history ?? [];
          this.reviewState = {};
          this.openReviewId = null;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Дошло је до грешке при учитавању резервација.';
          this.loading = false;
        }
      });
    }
  }

  private updateCalendar(): void {
    this.calendarOptions = {
      ...this.calendarOptions,
      events: this.calendarEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        color: event.status === 'pending' ? '#fbbf24' : '#22c55e',
        textColor: '#1f2937',
        extendedProps: {
          booking: event
        }
      }))
    };
  }

  // Tourist helpers
  hasCurrentBookings(): boolean {
    return this.currentBookings.length > 0;
  }

  hasHistoryBookings(): boolean {
    return this.historyBookings.length > 0;
  }

  cancelBooking(booking: BookingModel): void {
    if(this.role !== 'tourist' || !booking.canCancel) {
      return;
    }

    const confirmed = confirm('Да ли сте сигурни да желите да откажете резервацију?');
    if(!confirmed) {
      return;
    }

    this.loading = true;
    this.bookingService.cancelBooking(booking._id).subscribe({
      next: (res) => {
        this.success = res?.message || 'Резервација је отказана.';
        this.loadBookings();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Отказивање није успело.';
        this.loading = false;
      }
    });
  }

  openReview(booking: BookingModel): void {
    if(this.role !== 'tourist' || !booking.canReview) {
      return;
    }

    if(this.openReviewId === booking._id) {
      this.openReviewId = null;
      return;
    }

    this.reviewState[booking._id] = {
      rating: 0,
      comment: '',
      submitting: false,
      error: null
    };
    this.openReviewId = booking._id;
  }

  setRating(bookingId: string, value: number): void {
    if(!this.reviewState[bookingId]) {
      return;
    }
    this.reviewState[bookingId].rating = value;
  }

  submitReview(bookingId: string): void {
    const state = this.reviewState[bookingId];
    if(!state) {
      return;
    }

    state.error = null;

    if(state.rating < 1 || state.rating > 5) {
      state.error = 'Изаберите оцену од 1 до 5.';
      return;
    }

    state.submitting = true;

    this.bookingService.submitReview(bookingId, {
      rating: state.rating,
      comment: state.comment?.trim()
    }).subscribe({
      next: (res) => {
        this.success = res?.message || 'Хвала на утиску!';
        state.submitting = false;
        this.openReviewId = null;
        this.loadBookings();
      },
      error: (err) => {
        state.error = err?.error?.message || 'Слање утиска није успело.';
        state.submitting = false;
      }
    });
  }

  // Owner helpers
  getDecisionState(id: string): DecisionState {
    if(!this.decisionState[id]) {
      this.decisionState[id] = {
        comment: '',
        submitting: false,
        error: null
      };
    }
    return this.decisionState[id];
  }

  approveBooking(bookingId: string): void {
    this.handleStatusChange(bookingId, 'approve');
  }

  rejectBooking(bookingId: string): void {
    const state = this.getDecisionState(bookingId);
    if(!state.comment || !state.comment.trim()) {
      state.error = 'Коментар је обавезан приликом одбијања.';
      return;
    }
    this.handleStatusChange(bookingId, 'reject', state.comment.trim());
  }

  approveSelectedEvent(): void {
    if(this.selectedEvent) {
      this.approveBooking(this.selectedEvent.id);
    }
  }

  rejectSelectedEvent(): void {
    if(this.selectedEvent) {
      this.rejectBooking(this.selectedEvent.id);
    }
  }

  private handleStatusChange(bookingId: string, action: 'approve' | 'reject', comment?: string): void {
    if(this.role !== 'owner') {
      return;
    }

    const state = this.getDecisionState(bookingId);
    state.submitting = true;
    state.error = null;
    this.loading = true;

    this.bookingService.updateBookingStatus(bookingId, action, comment).subscribe({
      next: (res) => {
        this.success = res?.message || 'Промена статуса је сачувана.';
        state.submitting = false;
        this.selectedEvent = null;
        this.loadBookings();
      },
      error: (err) => {
        state.error = err?.error?.message || 'Измена статуса није успела.';
        state.submitting = false;
        this.loading = false;
      }
    });
  }

  onEventClick(arg: EventClickArg): void {
    if(this.role !== 'owner') {
      return;
    }
    const booking: CalendarBookingEvent | undefined = arg.event.extendedProps['booking'];
    if(booking) {
      this.selectedEvent = booking;
      this.getDecisionState(booking.id);
    }
  }

  closeEventDialog(): void {
    this.selectedEvent = null;
  }
}
