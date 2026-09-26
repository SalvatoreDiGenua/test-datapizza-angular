import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatHistoryStore } from '../../services/chat-history-store';

@Component({
  selector: 'app-chat-history',
  templateUrl: './chat-history.html',
  styleUrl: './chat-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MatIconModule, MatProgressSpinnerModule],
})
export class ChatHistory {
  readonly route = inject(ActivatedRoute);
  readonly store = inject(ChatHistoryStore);
}
