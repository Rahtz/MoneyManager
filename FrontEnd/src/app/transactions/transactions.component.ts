import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { SupabaseService } from '../supabase.service';
import { FormsModule } from '@angular/forms';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  categoryid: number;
}

interface User {
  email: string;
  username: string;
  id: string; // Auth ID
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
})
export class TransactionsComponent implements OnInit {
  authService = inject(AuthService);
  supabaseService = inject(SupabaseService);
  transactions: any[] = [];
  paginatedTransactions: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  newTransaction = {
    amount: 0,
    date: '',
    description: '',
    categoryid: 0,
  };

  editingTransaction = null;

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
          this.getPaginatedTransactions();
        }
      } else {
        console.error('User ID not found in users table');
      }
    } else {
      console.error('User ID is missing or not a string');
    }
  }

  getPaginatedTransactions(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedTransactions = this.transactions.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.getPaginatedTransactions();
  }

  async getUserIdFromAuthId(authId: string): Promise<string | null> {
    const { data, error } = await this.supabaseService.getUserByAuthId(authId);
    if (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
    return data?.id || null;
  }

  async createTransaction(): Promise<void> {
    const user = this.authService.currentUser() as User;
    if (user && typeof user.id === 'string') {
      const userId = await this.getUserIdFromAuthId(user.id);
      if (userId) {
        const { data, error } = await this.supabaseService.createTransaction(userId, this.newTransaction.date, this.newTransaction.description, this.newTransaction.amount, this.newTransaction.categoryid);
        if (error) {
          console.error('Error creating transaction:', error);
        } else {
          this.transactions.push(data);
          this.newTransaction = { amount: 0, date: '', description: '', categoryid: 0 }; // Reset form
        }
      } else {
        console.error('User ID not found in users table');
      }
    } else {
      console.error('User ID is missing or not a string');
    }
  }

  async deleteTransaction(transaction: Transaction): Promise<void> {
    const confirmed = window.confirm('Are you sure you want to delete this transaction?');
    if (confirmed) {
      const { error } = await this.supabaseService.deleteTransaction(transaction.id);
      if (error) {
        console.error('Error deleting transaction:', error);
      } else {
        this.transactions = this.transactions.filter(t => t.id !== transaction.id);
      }
    }
  }
}
