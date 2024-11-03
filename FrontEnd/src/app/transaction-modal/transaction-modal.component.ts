import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-modal.component.html',
})
export class TransactionModalComponent {
  @Input() transactions: any[] = [];
  @Input() isVisible: boolean = false;

  closeModal() {
    this.isVisible = false;
  }
}
