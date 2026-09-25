import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <a class="skip-link" href="#main-content"> Skip to main content </a>
    <router-outlet />
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
    }

    .skip-link {
      position: fixed;
      top: 0.75rem;
      left: 0.75rem;
      z-index: 1000;
      transform: translateY(-200%);
      border-radius: 0.5rem;
      background: #0f172a;
      color: white;
      padding: 0.75rem 1rem;
      font-weight: 600;
    }

    .skip-link:focus-visible {
      transform: translateY(0);
      outline: 3px solid #0284c7;
      outline-offset: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
