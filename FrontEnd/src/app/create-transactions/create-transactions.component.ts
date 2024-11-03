import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase.service'; // Import the SupabaseService
import { AuthService } from '../auth.service';

interface User {
  email: string;
  username: string;
  id: string;
}

@Component({
  selector: 'app-create-transactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './create-transactions.component.html',
})
export class CreateTransactionsComponent {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {} // Inject the SupabaseService

  ngOnInit() {
    this.addPasteListener();
  }

  async getUserIdFromAuthId(authId: string): Promise<string | null> {
    const { data, error } = await this.supabaseService.getUserByAuthId(authId);
    if (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
    return data?.id || null;
  }

  addPasteListener() {
    const table = document.getElementById('transactionTable');
    if (table) {
      table.addEventListener('paste', (event: ClipboardEvent) => {
        event.preventDefault();
        const clipboardData = event.clipboardData;
        if (clipboardData) {
          const pastedData = clipboardData.getData('Text');
          this.pasteData(pastedData);
        }
      });
    }
  }

  pasteData(data: string) {
    const rows = data.split('\n');
    const table = document.getElementById('transactionTable')?.getElementsByTagName('tbody')[0];
    if (table) {
      rows.forEach((row) => {
        const cells = row.split('\t');
        if (cells.length < 4 || cells.every(cell => cell.trim() === '')) {
          return; // Skip empty rows or rows with insufficient data
        }

        const tableRow = table.insertRow();
        cells.forEach((cellData, cellIndex) => {
          const cell = tableRow.insertCell();
          if (cellIndex === 0) {
            const formattedDate = this.formatDate(cellData);
            cell.innerHTML = `<input type="date" class="w-full" value="${formattedDate || ''}">`;
          } else {
            cell.contentEditable = 'true';
            cell.innerText = cellData;
          }
          cell.className = 'px-4 py-2 border border-gray-300';
        });
      });
    }
  }

  async submitTransactions() {
    const table = document.getElementById('transactionTable')?.getElementsByTagName('tbody')[0];
    if (table) {
      const transactions = [];
      for (let i = 0; i < table.rows.length; i++) {
        const row = table.rows[i];
        const transaction = {
          TransactionDate: (row.cells[0].firstChild as HTMLInputElement).value,
          Description: row.cells[1]?.innerText || '',
          Amount: parseFloat(row.cells[2]?.innerText || '0'),
          CategoryId: parseInt(row.cells[3]?.innerText || '0', 10)
        };
        if (transaction.TransactionDate && transaction.Description && !isNaN(transaction.Amount) && !isNaN(transaction.CategoryId)) {
          transactions.push(transaction);
        }
      }

      if (transactions.length > 0) {
        const user = this.authService.currentUser() as User;
        const userId = await this.getUserIdFromAuthId(user.id);
        if (userId) {
          const { data, error } = await this.supabaseService.createTransactions(userId, transactions);
          if (error) {
            console.error('Error creating transactions:', error);
          } else {
            console.log('Transactions created:', data);
          }
        } else {
          console.error('Error: userId is null');
        }
      }
    }
  }

  private formatDate(date: string): string | null {
    const parts = date.split('/');
    if (parts.length !== 3) {
      return null;
    }
    const [day, month, year] = parts;
    if (!day || !month || !year) {
      return null;
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
}
