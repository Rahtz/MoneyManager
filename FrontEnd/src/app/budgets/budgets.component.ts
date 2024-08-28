import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth.service';
import { TransactionWidgetComponent } from '../transaction-widget/transaction-widget.component';
import { Router } from '@angular/router';

interface User {
  email: string;
  username: string;
  id: string;
}

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, TransactionWidgetComponent],
  templateUrl: './budgets.component.html',
})
export class BudgetsComponent implements OnInit {
[x: string]: any;
  authService = inject(AuthService);
  budgets: any[] = [];
  yearlyBudgets: any[] = [];

  constructor(private supabaseService: SupabaseService, private router: Router) {}

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
        const { data: budgetsData, error: budgetsError } = await this.supabaseService.getBudgets(userId);
        if (budgetsError) {
          console.error('Error fetching budgets:', budgetsError);
        } else {
          this.budgets = budgetsData;
        }

        const { data: yearlyBudgetsData, error: yearlyBudgetsError } = await this.supabaseService.getYearlyBudgets(userId);
        if (yearlyBudgetsError) {
          console.error('Error fetching yearly budgets:', yearlyBudgetsError);
        } else {
          this.yearlyBudgets = yearlyBudgetsData;
        }
      } else {
        console.error('User ID not found in users table');
      }
    } else {
      console.error('User ID is missing or not a string');
    }
    this.sortBudgetsByPercentage();
  }

  getProgressWidth(transaction: any): number {
    return Math.min(((transaction.totalAmount)*-1 / transaction.BudgetAmount) * 100, 100);
  }

  getProgressPercentage(transaction: any): number {
    return Math.min(((transaction.totalAmount)*-1  / transaction.BudgetAmount) * 100, 100);
  }

  editBudget(budget: any) {
    // Implement edit functionality here
  }

  async deleteBudget(id: string) {
    const { error } = await this.supabaseService.deleteBudget(id);
    if (error) {
      console.error('Error deleting budget:', error);
    } else {
      this.budgets = this.budgets.filter(budget => budget.id !== id);
    }
  }

  navigateToBudgets() {
    this.router.navigate(['/createbudget']);
  }

  sortBudgetsByPercentage() {
    this.budgets.sort((a, b) => this.getProgressPercentage(b) - this.getProgressPercentage(a));
    this.yearlyBudgets.sort((a, b) => this.getProgressPercentage(b) - this.getProgressPercentage(a));
  }
}
