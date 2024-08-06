import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [ReactiveFormsModule,
    CommonModule, RouterOutlet, RouterLink],
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  router = inject(Router);
  authService = inject(AuthService);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', Validators.required],
    password: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
  });
  errorMessage: string | null = null;

  async onSubmit(): Promise<void> {
    const rawForm = this.form.getRawValue();
    try {
      await this.authService.register(
        rawForm.email,
        rawForm.password,
        rawForm.firstName,
        rawForm.lastName,
        rawForm.username
      );
      this.router.navigateByUrl('/');
    } catch (error) {
      if (error instanceof Error) {
        this.errorMessage = error.message;
      } else {
        this.errorMessage = 'An unknown error occurred';
      }
    }
  }
}
