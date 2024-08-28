import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth.service';
import { Chart, registerables } from 'chart.js';

interface User {
  email: string;
  username: string;
  id: string;
}

@Component({
  selector: 'app-spending-graph-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spending-graph-widget.component.html',
})
export class SpendingGraphWidgetComponent implements OnInit, AfterViewInit {
  authService = inject(AuthService);
  MonthlyNetWorth: number[] = [];
  MonthlyIncome: number[] = [];
  @ViewChild('spendingChart') spendingChart!: ElementRef<HTMLCanvasElement>;

  constructor(private supabaseService: SupabaseService) {
    Chart.register(...registerables);
  }

  async getUserIdFromAuthId(authId: string): Promise<string | null> {
    const { data, error } = await this.supabaseService.getUserByAuthId(authId);
    if (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
    return data?.id || null;
  }

  async ngOnInit(): Promise<void> {
    const user = this.authService.currentUser() as User; // Cast the user to the User interface
    if (user && typeof user.id === 'string') {
      const userId = await this.getUserIdFromAuthId(user.id);
      if (userId) {
        this.MonthlyNetWorth = await this.supabaseService.getMonthlyExpenses(userId);
        this.MonthlyIncome = await this.supabaseService.getMonthlyIncome(userId);
      } else {
        console.error('User ID not found in users table');
      }
    } else {
      console.error('User ID is missing or not a string');
    }
  }

  async ngAfterViewInit(): Promise<void> {
    const user = this.authService.currentUser() as User; // Cast the user to the User interface
    if (user && typeof user.id === 'string') {
      const userId = await this.getUserIdFromAuthId(user.id);
      if (userId) {
        this.MonthlyNetWorth = await this.supabaseService.getMonthlyExpenses(userId);
        this.MonthlyIncome = await this.supabaseService.getMonthlyIncome(userId);
        this.renderChart();
      } else {
        console.error('User ID not found in users table');
      }
    } else {
      console.error('User ID is missing or not a string');
    }
  }

  renderChart(): void {
    const ctx = this.spendingChart.nativeElement.getContext('2d');

    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Array.from({ length: this.MonthlyNetWorth.length }, (_, i) => `Month ${i + 1}`),
          datasets: [
            {
              label: 'Net Worth',
              data: this.MonthlyNetWorth,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            },
            {
              label: 'Income',
              data: this.MonthlyIncome,
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          plugins:{
            legend: {
              display: false,
            },
          },
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }
}
