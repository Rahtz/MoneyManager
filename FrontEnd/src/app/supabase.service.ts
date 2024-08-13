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
        .gte('TransactionDate', new Date(new Date().setDate(new Date().getDate() - 31)).toISOString())
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

  async getNetWorth(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('AccountValues')
      .select('AccountId, AccountValue, ValueDate, Accounts(Divisible, Type, PrimaryAccount)')
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
          primaryAccount: row.Accounts.PrimaryAccount
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
      .select('AccountId, AccountValue, ValueDate, Accounts(Divisible, Type, PrimaryAccount)')
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
          primaryAccount: row.Accounts.PrimaryAccount
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

  async getMonthlyNetWorth(userId: string): Promise<number[]> {
    const { data, error } = await this.supabase
      .from('AccountValues')
      .select('AccountId, AccountValue, ValueDate, Accounts(Divisible, Type, PrimaryAccount)')
      .eq('userId', userId)
      .gte('ValueDate', new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString())
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
          primaryAccount: row.Accounts.PrimaryAccount
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

    // Ensure the result array has 12 values, filling with 0 if necessary
    while (result.length < 12) {
      result.unshift(0);
    }
    console.log(result);
    return result;
  }

}
