import { Component, inject } from '@angular/core';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarData, SnackbarType } from '../../models/snackbar';

@Component({
  selector: 'app-snackbar',
  templateUrl: './snackbar.html',
  styleUrl: './snackbar.scss',
  imports: [MatSnackBarModule, MatIconModule],
})
export class Snackbar {
  readonly data = inject<SnackbarData>(MAT_SNACK_BAR_DATA);

  readonly icons: Record<SnackbarType, string> = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };
}
