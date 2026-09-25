import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../../../auth/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(Auth).accessToken();

  if (!token || req.url.startsWith('/')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
