import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../../../services/api-error';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errors = inject(ApiError);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        errors.report({
          status: error.status,
          message: error.message || 'An unexpected HTTP error occurred.',
          url: error.url ?? req.url,
        });
      }

      return throwError(() => error);
    }),
  );
};
