import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
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
  selector: 'app-networth-graph-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './networth-graph-widget.component.html',
})
export class NetworthGraphWidgetComponent implements OnInit, AfterViewInit {
  authService = inject(AuthService);
  MonthlyNetWorth: any[] = [];
  netWorthData: number[] = [];

  constructor(private supabaseService: SupabaseService) {}

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
          this.MonthlyNetWorth = await this.supabaseService.getMonthlyNetWorth(userId);
      } else {
        console.error('User ID not found in users table');
      }
    } else {
      console.error('User ID is missing or not a string');
    }
    console.log('ngOnInit - MonthlyNetWorth:', this.MonthlyNetWorth);
  }

async ngAfterViewInit(): Promise<void> {
  const user = this.authService.currentUser() as User; // Cast the user to the User interface
  if (user && typeof user.id === 'string') {
    const userId = await this.getUserIdFromAuthId(user.id);
    if (userId) {
        this.MonthlyNetWorth = await this.supabaseService.getMonthlyNetWorth(userId);
    } else {
      console.error('User ID not found in users table');
    }
  } else {
    console.error('User ID is missing or not a string');
  }
  console.log('ngOnInit - MonthlyNetWorth:', this.MonthlyNetWorth);
  if (this.MonthlyNetWorth && this.MonthlyNetWorth.length > 0) {
    this.initializeChart();
} else {
    console.error('MonthlyNetWorth is not populated');
}
}

initializeChart() {
  Chart.register(...registerables);
  const ctx = document.getElementById('networthChart') as HTMLCanvasElement;
  if (ctx) {
    // Reverse the MonthlyNetWorth array and create corresponding labels
    const reversedNetWorth = [...this.MonthlyNetWorth].reverse();
    const labels = reversedNetWorth.map((_, index) => `Month ${index + 1}`);

    console.log('initializeChart - MonthlyNetWorth:', reversedNetWorth); // Log the reversed array before creating the chart
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Net Worth',
          data: reversedNetWorth,
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          fill: false
        }]
      }
    });
  } else {
    console.error('Failed to acquire context for networthChart');
  }
}

}
