import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth.service';

interface User {
  email: string;
  username: string;
  id: string;
}

@Component({
  selector: 'app-cashflows',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cashflows.component.html',
})
export class CashflowsComponent implements OnInit {
  authService = inject(AuthService);
  categories: any[] = [];
  transactions: any[] = [];
  tableData: any[] = [];
  selectedYear: number = new Date().getFullYear(); // Initialize with the current year
  totals: { [key: string]: number } = {};

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
        const { data: budgetsData, error: budgetsError } = await this.supabaseService.getTransactions(userId);
        if (budgetsError) {
          console.error('Error fetching budgets:', budgetsError);
        } else {
          this.transactions = budgetsData;
        }

        const { data: yearlyBudgetsData, error: yearlyBudgetsError } = await this.supabaseService.getCategories(userId);
        if (yearlyBudgetsError) {
          console.error('Error fetching yearly budgets:', yearlyBudgetsError);
        } else {
          this.categories = yearlyBudgetsData;
        }
        this.processData();
      } else {
        console.error('User ID not found in users table');
      }
    } else {
      console.error('User ID is missing or not a string');
    }
  }

  filterDataByYear(year: number) {
    return this.transactions.filter(transaction => new Date(transaction.TransactionDate).getFullYear() === year);
  }

  processData() {
    const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('en', { month: 'short' }));
    const currentYearTransactions = this.filterDataByYear(this.selectedYear);
    const previousYearTransactions = this.filterDataByYear(this.selectedYear - 1);

    console.log('Current Year Transactions:', currentYearTransactions);
    console.log('Previous Year Transactions:', previousYearTransactions);

    this.tableData = this.categories.map(category => {
      const row: { [key: string]: any } = { CategoryName: category.CategoryName };
      let categoryTotalCurrentYear = 0;
      let categoryTotalPreviousYear = 0;
      months.forEach((month, index) => {
        const currentYearTotal = currentYearTransactions
          .filter(transaction => transaction.CategoryId === category.id && new Date(transaction.TransactionDate).getMonth() === index)
          .reduce((sum, transaction) => sum + transaction.Amount, 0);
        const previousYearTotal = previousYearTransactions
          .filter(transaction => transaction.CategoryId === category.id && new Date(transaction.TransactionDate).getMonth() === index)
          .reduce((sum, transaction) => sum + transaction.Amount, 0);
        row[`${month}CurrentYear`] = currentYearTotal;
        row[`${month}PreviousYear`] = previousYearTotal;
        categoryTotalCurrentYear += currentYearTotal;
        categoryTotalPreviousYear += previousYearTotal;
        this.totals[`${month}CurrentYear`] = (this.totals[`${month}CurrentYear`] || 0) + currentYearTotal;
        this.totals[`${month}PreviousYear`] = (this.totals[`${month}PreviousYear`] || 0) + previousYearTotal;
      });
      row['TotalCurrentYear'] = categoryTotalCurrentYear;
      row['TotalPreviousYear'] = categoryTotalPreviousYear;
      return row;
    });

    // Calculate grand totals
    this.totals['TotalCurrentYear'] = this.tableData.reduce((sum, row) => sum + row['TotalCurrentYear'], 0);
    this.totals['TotalPreviousYear'] = this.tableData.reduce((sum, row) => sum + row['TotalPreviousYear'], 0);

    console.log('Table Data:', this.tableData);
    console.log('Totals:', this.totals);
  }

  switchPreviousYear() {
    this.selectedYear -= 1; // Decrement the year
    this.processData(); // Re-process the data for the new year
  }

  switchNextYear() {
    this.selectedYear += 1; // Increment the year
    this.processData(); // Re-process the data for the new year
  }
}
