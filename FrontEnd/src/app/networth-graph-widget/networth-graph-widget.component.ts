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
  if (this.MonthlyNetWorth && this.MonthlyNetWorth.length > 0) {
    this.initializeChart();
} else {
    console.error('MonthlyNetWorth is not populated');
}
}

initializeChart() {
  Chart.register(...registerables);
  const ctx = document.getElementById('networthChart') as HTMLCanvasElement;
  const networthValueElement = document.getElementById('networthValue') as HTMLHeadingElement;

  if (ctx) {
    const chartContext = ctx.getContext('2d');
    if (chartContext) {
      // Create gradient
      const gradient = chartContext.createLinearGradient(20, 20, 0, ctx.height);
      gradient.addColorStop(0, 'rgba(75, 192, 192, 0.2)');
      gradient.addColorStop(1, 'rgba(75, 192, 192, 0)');

      // Reverse the MonthlyNetWorth array and create corresponding labels
      const reversedNetWorth = [...this.MonthlyNetWorth].reverse();
      const labels = reversedNetWorth.map((_, index) => `Month ${index + 1}`);

// Set the initial value to the latest net worth
const latestNetWorth = reversedNetWorth[reversedNetWorth.length - 1];
networthValueElement.textContent = `${latestNetWorth.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [{
      label: 'Net Worth',
      data: reversedNetWorth,
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
      fill: true, // Fill the area under the line
      backgroundColor: gradient, // Gradient color for the inside of the area
      pointRadius: 3, // Add dots on every point
      pointHitRadius: 10, // Increase the hit radius
      pointHoverRadius: 10 // Increase the hover radius
    }]
  },
  options: {
    plugins: {
      legend: {
        display: false // Remove the legend
      },
      tooltip: {
        enabled: false,
        callbacks: {
          label: function(context) {
            const value = context.raw;
            return `$${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          display: false // Hide X axis labels
        },
        grid: {
          display: false // Hide X axis grid lines
        }
      },
      y: {
        ticks: {
          display: false // Hide Y axis labels
        },
        grid: {
          display: false // Hide Y axis grid lines
        }
      }
    },
    onHover: (event, chartElement) => {
      if (chartElement.length) {
        const index = chartElement[0].index;
        const value = reversedNetWorth[index];
        networthValueElement.textContent = `${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
      } else {
        networthValueElement.textContent = `${latestNetWorth.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
      }
    }
  }
});
    } else {
      console.error('Failed to acquire 2D context for networthChart');
    }
  } else {
    console.error('Failed to acquire context for networthChart');
  }
}

}
