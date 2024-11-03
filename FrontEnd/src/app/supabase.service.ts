import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  from(table: string) {
    return this.supabase.from(table);
  }

  async getUserByAuthId(
    authId: string
  ): Promise<{ data: { id: string } | null; error: any }> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();
    return { data, error };
  }

  async getTransactions(userId: string): Promise<{ data: any[]; error: any }> {
    let allData: any[] = [];
    let from = 0;
    const limit = 1000;
    let error = null;

    while (true) {
      const { data, error: pageError } = await this.supabase
        .from('Transactions')
        .select('*')
        .eq('userId', userId)
        .order('TransactionDate', { ascending: false })
        .range(from, from + limit - 1);

      if (pageError) {
        error = pageError;
        break;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        from += limit;
      } else {
        break;
      }
    }
    return { data: allData, error };
  }

  async createTransaction(
    userId: string,
    TransactionDate: string,
    Description: string,
    Amount: number,
    CategoryId: number
  ): Promise<{ data: any; error: any }> {
    const { data, error } = await this.supabase
      .from('Transactions')
      .insert([{ userId, TransactionDate, Description, Amount, CategoryId }])
      .single();
    return { data, error };
  }

  async createTransactions(userId: string, transactions: any[]) {
    const { data, error } = await this.supabase
      .from('Transactions')
      .insert(transactions.map(transaction => ({ ...transaction, userId: userId })));
    return { data, error };
  }

  async deleteTransaction(
    transactionId: string
  ): Promise<{ data: any; error: any }> {
    const { data, error } = await this.supabase
      .from('Transactions')
      .delete()
      .eq('id', transactionId)
      .single();
    return { data, error };
  }

  async fetchTransactionsWidget(
    userId: string
  ): Promise<{ data: any[]; error: any }> {
    let allData: any[] = [];
    let from = 0;
    const limit = 1000;
    let error = null;

    while (true) {
      const { data, error: pageError } = await this.supabase
        .from('Transactions')
        .select('*')
        .eq('userId', userId)
        .gte(
          'TransactionDate',
          new Date(new Date().setDate(new Date().getDate() - 31)).toISOString()
        )
        .order('Amount', { ascending: false })
        .range(from, from + limit - 1);

      if (pageError) {
        error = pageError;
        break;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        from += limit;
      } else {
        break;
      }
    }

    return { data: allData, error };
  }

  async getDividendIncome(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('Dividends')
      .select('Amount, CurrencyConversion')
      .eq('userId', userId);

    if (error) {
      console.error('Error fetching dividend income:', error);
      return 0;
    }

    let dividendIncome = 0;
    data.forEach((row: any) => {
      const amount = row.Amount;
      const conversionRate = row.CurrencyConversion || 1; // Default to 1 if CurrencyConversion is not provided
      dividendIncome += amount / conversionRate;
    });

    return dividendIncome;
  }

  async getNetWorth(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('AccountValues')
      .select(
        'AccountId, AccountValue, ValueDate, Accounts(Divisible, Type, PrimaryAccount)'
      )
      .eq('userId', userId)
      .order('ValueDate', { ascending: false });

    if (error) {
      console.error('Error fetching account values:', error);
      return 0;
    }

    const latestValues = new Map();
    data.forEach((row: any) => {
      if (!latestValues.has(row.AccountId)) {
        latestValues.set(row.AccountId, {
          value: row.AccountValue,
          divisible: row.Accounts.Divisible,
          type: row.Accounts.Type,
          primaryAccount: row.Accounts.PrimaryAccount,
        });
      }
    });

    let netWorth = 0;
    latestValues.forEach((entry, accountId) => {
      const adjustedValue = entry.value / (entry.divisible || 1);
      if (entry.primaryAccount === true) {
        if (entry.type === 'Asset') {
          netWorth += adjustedValue;
        } else if (entry.type === 'Liability') {
          netWorth -= adjustedValue;
        }
      }
    });

    return netWorth;
  }

  async getSecondaryNetWorth(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('AccountValues')
      .select('*, Accounts(Divisible, Type, PrimaryAccount)')
      .eq('userId', userId)
      .order('ValueDate', { ascending: false });

    if (error) {
      console.error('Error fetching account values:', error);
      return 0;
    }

    const latestValues = new Map();
    data.forEach((row: any) => {
      if (!latestValues.has(row.AccountId)) {
        latestValues.set(row.AccountId, {
          value: row.AccountValue,
          divisible: row.Accounts.Divisible,
          type: row.Accounts.Type,
          primaryAccount: row.Accounts.PrimaryAccount,
        });
      }
    });

    let secondaryNetWorth = 0;
    latestValues.forEach((entry, accountId) => {
      const adjustedValue = entry.value / (entry.divisible || 1);
      if (entry.type === 'Asset') {
        secondaryNetWorth += adjustedValue;
      } else if (entry.type === 'Liability') {
        secondaryNetWorth -= adjustedValue;
      }
    });

    return secondaryNetWorth;
  }

  async getMonthlyExpenses(userId: string): Promise<number[]> {
    let allData: any[] = [];
    let from = 0;
    const limit = 1000;

    while (true) {
      const { data, error } = await this.supabase
        .from('Transactions')
        .select(`
          *,
          Category (
            id,
            CategoryCatId
          )
        `)
        .eq('userId', userId)
        .order('TransactionDate', { ascending: false })
        .range(from, from + limit - 1);

      if (error) {
        console.error('Error fetching monthly Transactions:', error.message, error.details);
        break;
      }
      if (data && data.length > 0) {
        allData = allData.concat(data);
        from += limit;
      } else {
        break;
      }
    }

    // Filter transactions based on Category.CategoryCatId value
    const filteredData = allData.filter(row => row.Category.CategoryCatId === 1);

    const monthlyExpenses = new Map<string, Map<string, any>>();

    filteredData.forEach((row: any) => {
      const month = new Date(row.TransactionDate).toISOString().slice(0, 7); // YYYY-MM format
      if (!monthlyExpenses.has(month)) {
        monthlyExpenses.set(month, new Map());
      }

      const latestValues = monthlyExpenses.get(month)!;
      if (!latestValues.has(row.MonthYear)) {
        latestValues.set(row.MonthYear, {
          amount: 0,
          transactions: [],
        });
      }
      const entry = latestValues.get(row.MonthYear)!;
      entry.amount += row.Amount;
      entry.transactions.push(row);
    });

    const result: number[] = [];

    monthlyExpenses.forEach((latestValues) => {
      let totalAmount = 0;
      latestValues.forEach((entry, MonthYear) => {
        totalAmount += (entry.amount) * -1;
        // console.log(`MonthYear: ${MonthYear}, Transactions:`, entry.transactions);
      });
      result.push(totalAmount);
    });

    // console.log(result);
    result.splice(12);
    return result;
  }

async getMonthlyIncome(userId: string): Promise<number[]> {
  let allData: any[] = [];
  let from = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await this.supabase
      .from('Transactions')
      .select(`
        *,
        Category (
          id,
          CategoryCatId
        )
      `)
      .eq('userId', userId)
      .order('TransactionDate', { ascending: false })
      .range(from, from + limit - 1);

    if (error) {
      console.error('Error fetching monthly Transactions:', error.message, error.details);
      break;
    }
    if (data && data.length > 0) {
      allData = allData.concat(data);
      from += limit;
    } else {
      break;
    }
  }

  // Filter transactions based on Category.CategoryCatId value
  const filteredData = allData.filter(row => row.Category.CategoryCatId === 4);

  const monthlyExpenses = new Map<string, Map<string, any>>();

  filteredData.forEach((row: any) => {
    const month = new Date(row.TransactionDate).toISOString().slice(0, 7); // YYYY-MM format
    if (!monthlyExpenses.has(month)) {
      monthlyExpenses.set(month, new Map());
    }

    const latestValues = monthlyExpenses.get(month)!;
    if (!latestValues.has(row.MonthYear)) {
      latestValues.set(row.MonthYear, {
        amount: 0,
        transactions: [],
      });
    }
    const entry = latestValues.get(row.MonthYear)!;
    entry.amount += row.Amount;
    entry.transactions.push(row);
  });

  const result: number[] = [];

  monthlyExpenses.forEach((latestValues) => {
    let totalAmount = 0;
    latestValues.forEach((entry, MonthYear) => {
      totalAmount += entry.amount;
      // console.log(`MonthYear: ${MonthYear}, Transactions:`, entry.transactions);
    });
    result.push(totalAmount);
  });

  // console.log(result);
  result.splice(12);
  return result;
}

  async getMonthlyNetWorth(userId: string): Promise<number[]> {
    const { data, error } = await this.supabase
      .from('AccountValues')
      .select(
        'AccountId, AccountValue, ValueDate, Accounts(Divisible, Type, PrimaryAccount)'
      )
      .eq('userId', userId)
      .gte(
        'ValueDate',
        new Date(
          new Date().setMonth(new Date().getMonth() - 2 - 12)
        ).toISOString()
      )
      .order('ValueDate', { ascending: false });

    if (error) {
      console.error('Error fetching account values:', error);
      return [];
    }

    const monthlyNetWorth = new Map<string, Map<string, any>>();

    data.forEach((row: any) => {
      const month = new Date(row.ValueDate).toISOString().slice(0, 7); // YYYY-MM format
      if (!monthlyNetWorth.has(month)) {
        monthlyNetWorth.set(month, new Map());
      }

      const latestValues = monthlyNetWorth.get(month)!;
      if (!latestValues.has(row.AccountId)) {
        latestValues.set(row.AccountId, {
          value: row.AccountValue,
          divisible: row.Accounts.Divisible,
          type: row.Accounts.Type,
          primaryAccount: row.Accounts.PrimaryAccount,
        });
      }
    });

    const result: number[] = [];

    monthlyNetWorth.forEach((latestValues, month) => {
      let netWorth = 0;
      latestValues.forEach((entry, accountId) => {
        const adjustedValue = entry.value / (entry.divisible || 1);
        if (entry.primaryAccount === true) {
          if (entry.type === 'Asset') {
            netWorth += adjustedValue;
          } else if (entry.type === 'Liability') {
            netWorth -= adjustedValue;
          }
        }
      });
      result.push(netWorth);
    });

    // Remove the latest month if its net worth is 0
    if (result[0] === 0) {
      result.shift();
    }

    // Ensure the result array has 12 values, taking the latest 12 months
    result.splice(12);

    // Ensure the result array has 12 values, filling with 0 if necessary
    while (result.length < 12) {
      result.unshift(0);
    }

    return result;
  }

  async getBudgets(userId: string): Promise<{ data: any[]; error: any }> {
    let allData: any[] = [];
    let from = 0;
    const limit = 1000;
    let error = null;

    while (true) {
      const { data, error: pageError } = await this.supabase
        .from('Budgets')
        .select(`
        *,
        Category (
          id,
          CategoryName
        )
      `)
        .eq('userId', userId)
        .eq('Occurrence', "Monthly")
        .order('BudgetDate', { ascending: false })
        .range(from, from + limit - 1);

      if (pageError) {
        error = pageError;
        break;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        from += limit;
      } else {
        break;
      }
    }

    // Fetch total amount from Transactions for each budget
    for (const budget of allData) {
      const { data: transactionsData, error: transactionsError } = await this.supabase
        .from('Transactions')
        .select('Amount')
        .eq('CategoryId', budget.CategoryId)
        .eq('MonthYear', budget.MonthYear);

      if (transactionsError) {
        error = transactionsError;
        break;
      }

      const totalAmount = transactionsData.reduce((sum: number, transaction: any) => sum + transaction.Amount, 0);
      budget.totalAmount = totalAmount;
    }

    console.log(allData);
    return { data: allData, error };
}

async getYearlyBudgets(userId: string): Promise<{ data: any[]; error: any }> {
  let allData: any[] = [];
  let from = 0;
  const limit = 1000;
  let error = null;

  while (true) {
    const { data, error: pageError } = await this.supabase
      .from('Budgets')
      .select(`
      *,
      Category (
        id,
        CategoryName
      )
    `)
      .eq('userId', userId)
      .eq('Occurrence', "Yearly")
      .order('BudgetDate', { ascending: false })
      .range(from, from + limit - 1);

    if (pageError) {
      error = pageError;
      break;
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      from += limit;
    } else {
      break;
    }
  }

  // Fetch total amount from Transactions for each budget
  for (const budget of allData) {
    const { data: transactionsData, error: transactionsError } = await this.supabase
      .from('Transactions')
      .select('Amount')
      .eq('CategoryId', budget.CategoryId)
      .eq('Year', budget.Year);

    if (transactionsError) {
      error = transactionsError;
      break;
    }

    const totalAmount = transactionsData.reduce((sum: number, transaction: any) => sum + transaction.Amount, 0);
    budget.totalAmount = totalAmount;
  }

  console.log(allData);
  return { data: allData, error };
}

async createBudget(budget: any) {
  const { data, error } = await this.supabase
    .from('Budgets')
    .insert([budget]);
  return { data, error };
}

async deleteBudget(id: string) {
  const { error } = await this.supabase
    .from('Budgets')
    .delete()
    .eq('id', id);
  return { error };
}

async getCategories(userId: string): Promise<{ data: any[]; error: any }> {
    let allData: any[] = [];
    let from = 0;
    const limit = 1000;
    let error = null;

    while (true) {
      const { data, error: pageError } = await this.supabase
        .from('Category')
        .select(`
      *,
      CategoryCats (
        id,
        CategoryCatName
      )
    `)
        .eq('userId', userId)
        .eq('includeInCashflows', true)
        .range(from, from + limit - 1);

      if (pageError) {
        error = pageError;
        break;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        from += limit;
      } else {
        break;
      }
    }
    return { data: allData, error };
  }
}
