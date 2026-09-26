import { inject, Service } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Snackbar } from '../components/snackbar/snackbar';
import { SnackbarType, SnackbarData } from '../models/snackbar';

@Service()
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);

  open(
    type: SnackbarType,
    message: string,
    title?: string,
    duration = 4000,
  ): void {
    const data: SnackbarData = {
      type,
      message,
      title,
    };

    this.snackBar.dismiss();

    this.snackBar.openFromComponent(Snackbar, {
      data,
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['app-snackbar-panel'],
    });
  }

  success(message: string, title = 'Operazione completata'): void {
    this.open('success', message, title);
  }

  error(message: string, title = 'Si è verificato un errore'): void {
    this.open('error', message, title, 6000);
  }

  warning(message: string, title = 'Attenzione'): void {
    this.open('warning', message, title);
  }

  info(message: string, title = 'Informazione'): void {
    this.open('info', message, title);
  }
}
