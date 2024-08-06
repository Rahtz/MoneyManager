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
    const { data, error } = await this.supabase
      .from('Transactions')
      .select('*')
      .eq('userId', userId);
    return { data: data ?? [], error };
  }
}
