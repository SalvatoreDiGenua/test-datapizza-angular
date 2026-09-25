import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiError } from './core/services/api-error/api-error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatIconModule],
  template: `
    <a class="skip-link" href="#main-content"> Skip to main content </a>
    <router-outlet />
    <ng-template #httpErrorSnackbar>
      <div class="gap-3 max-w-sm flex items-center">
        <mat-icon class="text-red-500! min-w-[24px]">error_outline</mat-icon>

        <span class="text-sm">
          {{ apiErrorService.error()?.message }}
        </span>
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      flex: 1 1 auto;
      height: 100%;
      display: flex;
      flex-direction: column;
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
export class App {
  public readonly apiErrorService = inject(ApiError);
  private readonly snackBar = inject(MatSnackBar);
  private readonly httpErrorSnackbarTemplate =
    viewChild<TemplateRef<HTMLDivElement>>('httpErrorSnackbar');

  constructor() {
    effect(() => {
      const error = this.apiErrorService.error();
      if (!error?.message) {
        return;
      }
      this.snackBar.openFromTemplate(
        this.httpErrorSnackbarTemplate() as TemplateRef<HTMLDivElement>,
        {
          duration: 2500,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        },
      );
    });
  }
}
