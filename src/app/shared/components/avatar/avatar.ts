import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
})
export class Avatar {
  readonly username = input.required<string>();

  readonly initial = computed(() => {
    const username = this.username().trim();
    return username.charAt(0).toUpperCase() || '?';
  });
}
