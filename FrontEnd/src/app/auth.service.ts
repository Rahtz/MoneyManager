import { Injectable, signal } from '@angular/core';
import { AuthResponse, createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  currentUser = signal<{ email: string; username: string } | null>(null);

  async register(email: string, password: string, firstName: string, lastName: string, username: string): Promise<void> {
    console.log('Registering user with username:', username);
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          username
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data?.user;

    if (user) {
      const { error: insertError } = await this.supabase
        .from('users')
        .insert({
          auth_id: user.id,
          email: user.email,
          username, // Use the provided username
          firstName,
          lastName
        });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const promise = this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return from(promise);
  }

  logout(): void {
    this.supabase.auth.signOut();
  }
}
