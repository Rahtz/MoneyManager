import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth.service';

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
export class NetworthGraphWidgetComponent implements OnInit {
  authService = inject(AuthService);
  MonthlyNetWorth: any[] = [];

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
        console.log('MonthlyNetWorth:', this.MonthlyNetWorth); // Log the MonthlyNetWorth array
      } else {
        console.error('User ID not found in users table');
      }
    } else {
      console.error('User ID is missing or not a string');
    }
  }
}
