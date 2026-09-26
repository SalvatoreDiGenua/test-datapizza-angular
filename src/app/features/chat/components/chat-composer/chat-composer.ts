import { Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-chat-composer',
  templateUrl: './chat-composer.html',
  styleUrl: './chat-composer.scss',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class ChatComposer {
  readonly disabled = input(false);
  readonly sendMessage = output<string>();

  readonly draft = signal('');

  readonly canSend = computed(
    () => !this.disabled() && this.draft().trim().length > 0,
  );

  updateDraft(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.draft.set(textarea.value);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.submit();
  }

  submit(): void {
    const content = this.draft().trim();

    if (!content || this.disabled()) {
      return;
    }

    this.sendMessage.emit(content);
    this.draft.set('');
  }
}
