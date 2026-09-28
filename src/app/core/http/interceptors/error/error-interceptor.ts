import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiHttpError } from '../../../services/api-error/api-http-error';
import {
  getApiErrorMessage,
  getTechnicalErrorMessage,
} from '../../../services/api-error/api-error-message';
import { SnackbarService } from '../../../../shared/services/snackbar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar = inject(SnackbarService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const apiError = new ApiHttpError(
        error.status,
        getTechnicalErrorMessage(error),
        error.url ?? req.url,
      );

      snackbar.error(getApiErrorMessage(apiError));

      return throwError(() => apiError);
    }),
  );
};
