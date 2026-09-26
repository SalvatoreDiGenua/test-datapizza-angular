import { isPlatformBrowser } from '@angular/common';
import {
  ApplicationConfig,
  isDevMode,
  PLATFORM_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoPersistLang } from '@jsverse/transloco-persist-lang';
import { provideMarkdown } from 'ngx-markdown';
import { routes } from './app.routes';
import { authInterceptor } from './core/http/interceptors/auth/auth-interceptor';
import { errorInterceptor } from './core/http/interceptors/error/error-interceptor';
import { Language } from './core/i18n/language';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { provideApi } from './api';
import { environment } from '../environments/environment.development';

class NoopStorage implements Storage {
  readonly length = 0;
  clear(): void {
    //
  }
  getItem(): string | null {
    return null;
  }
  key(): string | null {
    return null;
  }
  removeItem(): void {
    //
  }
  setItem(): void {
    //
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'top',
      }),
    ),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideTransloco({
      config: {
        availableLangs: ['it', 'en'],
        defaultLang: 'it',
        fallbackLang: 'it',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoPersistLang({
      storage: {
        useFactory: (platformId: object) =>
          isPlatformBrowser(platformId) ? localStorage : new NoopStorage(),
        deps: [PLATFORM_ID],
      },
      storageKey: Language.storageKey,
    }),
    provideApi({
      basePath: environment.baseApiUrl,
      withCredentials: true,
    }),
    provideMarkdown(),
  ],
};