import { Injectable, signal } from '@angular/core';
import { AuthResponse, createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  currentUser = signal<{ id: string; email: string; username: string } | null>(null);

  constructor(private router: Router) {
    this.checkAuthStatus();
  }

  async register(email: string, password: string, firstName: string, lastName: string, username: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          username,
        },
      },
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
          lastName,
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
    this.currentUser.set(null); // Clear the current user
    this.router.navigate(['/']);
  }

  async checkAuthStatus(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    if (!data.session) {
      this.currentUser.set(null);
    } else {
      this.currentUser.set({
        id: data.session.user.id,
        email: data.session.user.email ?? '',
        username: data.session.user.user_metadata['username'] ?? '',
      });
    }
  }

  getCurrentUser() {
    return this.currentUser();
  }
}
