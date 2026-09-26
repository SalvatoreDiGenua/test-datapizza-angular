import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-chat-header',
  templateUrl: './chat-header.html',
  imports: [MatIconModule, MatProgressSpinnerModule],
})
export class ChatHeader {
  readonly sending = input(false);
}
