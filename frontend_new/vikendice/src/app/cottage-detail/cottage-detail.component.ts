import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CottageService } from '../services/cottage.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cottage-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cottage-detail.component.html',
  styleUrl: './cottage-detail.component.css'
})
export class CottageDetailComponent implements OnInit {
    cottage: any;
  reviews: any[] = [];
  avgRating: number | null = null;

  constructor(private route: ActivatedRoute, private cottageService: CottageService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    console.log('Cottage ID from route:', id);
    this.cottageService.getCottageDetails(id).subscribe(res => {
      this.cottage = res.cottage;
      this.reviews = res.reviews;
      this.avgRating = res.avgRating;
    });
  }

}
