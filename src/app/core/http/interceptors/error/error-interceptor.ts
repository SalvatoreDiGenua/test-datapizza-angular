import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiHttpError } from '../../../services/api-error/api-http-error';
import { getTechnicalErrorMessage } from '../../../services/api-error/api-error-message';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      return throwError(
        () =>
          new ApiHttpError(
            error.status,
            getTechnicalErrorMessage(error),
            error.url ?? req.url,
          ),
      );
    }),
  );
