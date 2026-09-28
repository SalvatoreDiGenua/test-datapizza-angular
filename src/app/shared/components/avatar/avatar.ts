import { Component, computed, input } from '@angular/core';
import { MatRipple } from '@angular/material/core';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
  imports: [MatRipple],
})
export class Avatar {
  readonly username = input.required<string>();

  readonly initial = computed(() => {
    const username = this.username().trim();
    return username.charAt(0).toUpperCase() || '?';
  });
}
