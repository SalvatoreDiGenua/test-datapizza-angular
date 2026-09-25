import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Auth } from './auth';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  it('allows navigation for an authenticated user', () => {
    const auth = TestBed.inject(Auth);
    auth.setSession({
      user: {
        id: 'user-1',
        email: 'ada@example.com',
        name: 'Ada Lovelace',
      },
      accessToken: 'token-123',
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/protected' } as never),
    );

    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to not-allowed with the original URL', () => {
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/protected?tab=profile' } as never),
    );

    expect(
      router.serializeUrl(result as ReturnType<Router['createUrlTree']>),
    ).toBe('/not-allowed?returnUrl=%2Fprotected%3Ftab%3Dprofile');
  });
});
