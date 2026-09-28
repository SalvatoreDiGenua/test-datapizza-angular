import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, throwError } from 'rxjs';
import { ApiHttpError } from '../../../services/api-error/api-http-error';
import { errorInterceptor } from './error-interceptor';

describe('errorInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => errorInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('normalizes HTTP errors and rethrows them as ApiHttpError', async () => {
    const error = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: '/api/profile',
    });

    const request = new HttpRequest('GET', '/api/profile');

    const result = firstValueFrom(
      interceptor(request, () => throwError(() => error)),
    );

    await expect(result).rejects.toEqual(
      new ApiHttpError(401, error.message, '/api/profile'),
    );
  });

  it('uses the request URL when the HTTP error has no URL', async () => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
    });

    const request = new HttpRequest('GET', '/api/fallback');

    const result = firstValueFrom(
      interceptor(request, () => throwError(() => error)),
    );

    await expect(result).rejects.toEqual(
      new ApiHttpError(500, error.message, '/api/fallback'),
    );
  });

  it('does not normalize non-HTTP errors', async () => {
    const error = new Error('Unexpected failure');
    const request = new HttpRequest('GET', '/api/profile');

    await expect(
      firstValueFrom(interceptor(request, () => throwError(() => error))),
    ).rejects.toBe(error);
  });
});
