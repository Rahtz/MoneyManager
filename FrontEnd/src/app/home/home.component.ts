import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { TransactionWidgetComponent } from '../transaction-widget/transaction-widget.component';
import { NetworthWidgetComponent } from '../networth-widget/networth-widget.component';
import { NetworthGraphWidgetComponent } from '../networth-graph-widget/networth-graph-widget.component';
import { SpendingGraphWidgetComponent } from '../spending-graph-widget/spending-graph-widget.component';
import { DividendWidgetComponent } from '../dividend-widget/dividend-widget.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TransactionWidgetComponent, NetworthWidgetComponent, NetworthGraphWidgetComponent, SpendingGraphWidgetComponent, DividendWidgetComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  authService = inject(AuthService);
  constructor(private router: Router) {}

}
