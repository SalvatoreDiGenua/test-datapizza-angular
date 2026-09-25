import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chat {}
