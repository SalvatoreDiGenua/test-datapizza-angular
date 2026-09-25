import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, throwError } from 'rxjs';
import { ApiError } from '../../../services/api-error';
import { errorInterceptor } from './error-interceptor';

describe('errorInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => errorInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('reports HTTP errors and rethrows the original error', async () => {
    const apiError = TestBed.inject(ApiError);
    const error = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: '/api/profile',
    });

    const request = new HttpRequest('GET', '/api/profile');

    await expect(
      firstValueFrom(interceptor(request, () => throwError(() => error))),
    ).rejects.toBe(error);

    expect(apiError.error()).toEqual({
      status: 401,
      message: error.message,
      url: '/api/profile',
    });
  });

  it('uses the request URL when the HTTP error has no URL', async () => {
    const apiError = TestBed.inject(ApiError);
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
    });

    const request = new HttpRequest('GET', '/api/fallback');

    await expect(
      firstValueFrom(interceptor(request, () => throwError(() => error))),
    ).rejects.toBe(error);

    expect(apiError.error()?.url).toBe('/api/fallback');
  });

  it('does not report non-HTTP errors', async () => {
    const apiError = TestBed.inject(ApiError);
    const error = new Error('Unexpected failure');
    const request = new HttpRequest('GET', '/api/profile');

    await expect(
      firstValueFrom(interceptor(request, () => throwError(() => error))),
    ).rejects.toBe(error);

    expect(apiError.error()).toBeNull();
  });
});
