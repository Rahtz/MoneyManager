import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { DividendsComponent } from './dividends/dividends.component';
import { CashflowsComponent } from './cashflows/cashflows.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'dividends', component: DividendsComponent },
  { path: 'cashflows', component: CashflowsComponent },
];

export const appRoutingProviders = [
  provideRouter(routes)
];
