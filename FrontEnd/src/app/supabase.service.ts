import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async getUserByAuthId(authId: string): Promise<{ data: { id: string } | null; error: any }> {
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
}
