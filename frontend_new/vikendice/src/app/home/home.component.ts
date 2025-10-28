import { Component, OnInit } from '@angular/core';
import { HomeService } from '../services/home.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

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

  constructor(private homeService: HomeService) {}

  ngOnInit() {
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

}
