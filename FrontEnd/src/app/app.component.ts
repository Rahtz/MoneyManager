import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NavbarComponent } from './navbar/navbar.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, NavbarComponent, TransactionsComponent, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  router = inject(Router);
  authService = inject(AuthService);

  ngOnInit(): void {
    // Check authentication status on initialization
    this.authService.checkAuthStatus();

    // Listen for authentication state changes
    this.authService.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        this.authService.currentUser.set({
          id: session?.user.id!,
          email: session?.user.email!,
          username: session?.user.identities?.at(0)?.identity_data?.['username'],
        });
      } else if (event === 'SIGNED_OUT') {
        this.authService.currentUser.set(null);
        this.router.navigateByUrl('/');
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
