import { Component, OnInit } from '@angular/core';
import { HomeService } from '../services/home.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
    stats: any = {};
  cottages: any[] = [];
  searchName: string = '';
  searchLocation: string = '';
  sortBy: string = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  showTouristFeatures = false;
  stars = [0, 1, 2, 3, 4];

  constructor(private homeService: HomeService, private authService: AuthService) {}

  ngOnInit() {
    this.evaluateUserState();
    this.loadStats();
    this.loadCottages();
  }

  loadStats() {
    this.homeService.getStats().subscribe(res => {
      this.stats = res;
    });
  }

  loadCottages() {
    this.homeService.searchCottages(this.searchName, this.searchLocation, this.sortBy, this.sortOrder)
      .subscribe(res => {
        this.cottages = res;
      });
  }

  search() {
    this.loadCottages();
  }

  sort(column: string) {
    if(this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.loadCottages();
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

  private evaluateUserState() {
    const token = this.authService.getToken();
    const user = this.authService.getUser();
    this.showTouristFeatures = !!token && !!user && user.role === 'tourist';
  }

}
