import { TestBed } from '@angular/core/testing';
import { Auth } from './auth';
import type { AuthSession, AuthUser } from './auth.types';

describe('Auth', () => {
  let auth: Auth;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    auth = TestBed.inject(Auth);
  });

  it('starts with an unauthenticated empty session', () => {
    expect(auth.user()).toBeNull();
    expect(auth.accessToken()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('sets the complete session and exposes derived signal state', () => {
    const user: AuthUser = {
      id: 'user-1',
      email: 'ada@example.com',
      name: 'Ada Lovelace',
    };
    const session: AuthSession = {
      user,
      accessToken: 'token-123',
    };

    auth.setSession(session);

    expect(auth.user()).toEqual(user);
    expect(auth.accessToken()).toBe('token-123');
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('updates the user without discarding the access token', () => {
    auth.setAccessToken('token-123');
    const user: AuthUser = {
      id: 'user-2',
      email: 'grace@example.com',
      name: 'Grace Hopper',
    };

    auth.setUser(user);

    expect(auth.user()).toEqual(user);
    expect(auth.accessToken()).toBe('token-123');
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('clears the complete session on logout', () => {
    auth.setSession({
      user: {
        id: 'user-1',
        email: 'ada@example.com',
        name: 'Ada Lovelace',
      },
      accessToken: 'token-123',
    });

    auth.logout();

    expect(auth.user()).toBeNull();
    expect(auth.accessToken()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });
});
