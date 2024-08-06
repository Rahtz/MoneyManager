import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { SupabaseService } from '../supabase.service';

interface User {
  email: string;
  username: string;
  id: string; // Auth ID
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions.component.html',
})
export class TransactionsComponent implements OnInit {
  authService = inject(AuthService);
  supabaseService = inject(SupabaseService);
  transactions: any[] = [];

  async ngOnInit(): Promise<void> {
    const user = this.authService.currentUser() as User; // Cast the user to the User interface
    if (user && typeof user.id === 'string') {
      const userId = await this.getUserIdFromAuthId(user.id);
      if (userId) {
        const { data, error } = await this.supabaseService.getTransactions(userId);
        if (error) {
          console.error('Error fetching transactions:', error);
        } else {
          this.transactions = data;
        }
      } else {
        console.error('User ID not found in users table');
      }
    } else {
      console.error('User ID is missing or not a string');
    }
  }

  async getUserIdFromAuthId(authId: string): Promise<string | null> {
    const { data, error } = await this.supabaseService.getUserByAuthId(authId);
    if (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
    return data?.id || null;
  }
}
