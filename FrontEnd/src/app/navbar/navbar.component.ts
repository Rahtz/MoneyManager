import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  authService = inject(AuthService);
  constructor(private router: Router) {}

  isActive(path: string): boolean {
    const currentRoute = this.router.url;
    const isActive = currentRoute === path;
    return isActive;
  }

  logout(): void {
    this.authService.logout();
  }
}
