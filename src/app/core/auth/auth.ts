import { computed, Service, signal } from '@angular/core';
import { AuthSession, AuthUser } from './auth.types';

@Service()
export class Auth {
  private readonly sessionState = signal<AuthSession>({
    user: null,
    accessToken: null,
  });

  readonly user = computed(() => this.sessionState().user);
  readonly accessToken = computed(() => this.sessionState().accessToken);

  readonly isAuthenticated = computed(() => this.user() !== null);

  setSession(session: AuthSession): void {
    this.sessionState.set(session);
  }

  setUser(user: AuthUser | null): void {
    this.sessionState.update((session) => ({ ...session, user }));
  }

  setAccessToken(accessToken: string | null): void {
    this.sessionState.update((session) => ({ ...session, accessToken }));
  }

  logout(): void {
    this.sessionState.set({ user: null, accessToken: null });
  }
}
