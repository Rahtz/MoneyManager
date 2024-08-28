import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

interface User {
  email: string;
  username: string;
  id: string;
}

@Component({
  selector: 'app-create-budget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-budget.component.html',
})
export class CreateBudgetComponent implements OnInit {
  budgetForm: FormGroup;
  categories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private router: Router
  ) {
    this.budgetForm = this.fb.group({
      BudgetDate: ['', Validators.required],
      CategoryId: ['', Validators.required],
      BudgetAmount: ['', [Validators.required, Validators.min(0)]],
      Occurrence: ['', Validators.required]
    });
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
        const { data: yearlyBudgetsData, error: yearlyBudgetsError } = await this.supabaseService.getCategories(userId);
        if (yearlyBudgetsError) {
          console.error('Error fetching yearly budgets:', yearlyBudgetsError);
        } else {
          this.categories = yearlyBudgetsData;
        }
      } else {
        console.error('User ID not found in users table');
      }
    } else {
      console.error('User ID is missing or not a string');
    }
  }

  async onSubmit() {
    const user = this.authService.currentUser() as User;
    const userId = await this.getUserIdFromAuthId(user.id);
    if (user && typeof user.id === 'string') {
      const formValues = this.budgetForm.value;
      const budgetDate = new Date(formValues.BudgetDate);
      const month = (budgetDate.getMonth() + 1).toString().padStart(2, '0');
      const year = budgetDate.getFullYear().toString();
      const monthYear = `${month}-${year}`;

      const budget = {
        BudgetDate: formValues.BudgetDate,
        CategoryId: formValues.CategoryId,
        BudgetAmount: formValues.BudgetAmount,
        Occurrence: formValues.Occurrence,
        userId: userId,
        MonthYear: monthYear,
        Year: year
      };

      const { data, error } = await this.supabaseService.createBudget(budget);
      if (error) {
        console.error('Error creating budget:', error);
      } else {
        console.log('Budget created successfully:', data);
        this.router.navigate(['/budgets']);
      }
    } else {
      console.error('User is not logged in or user ID is missing');
    }
  }

}
