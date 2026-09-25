import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject, signal, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type SupportedLanguage = 'it' | 'en';

@Service()
export class Language {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  static readonly storageKey = 'test-datapizza-angular.language-key';
  static readonly langQueryParam = 'lang';

  readonly language = signal<SupportedLanguage>(this.getInitialLanguage());

  constructor() {
    this.applyLanguage(this.language());
  }

  setLanguage(language: SupportedLanguage): void {
    this.language.set(language);
    this.applyLanguage(language);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(Language.storageKey, language);
      this.syncUrl(language);
    }
  }

  toggle(): void {
    this.setLanguage(this.language() === 'it' ? 'en' : 'it');
  }

  private applyLanguage(language: SupportedLanguage): void {
    this.transloco.setActiveLang(language);
    this.document.documentElement.lang = language;
  }

  private getInitialLanguage(): SupportedLanguage {
    if (!isPlatformBrowser(this.platformId)) {
      return 'en';
    }

    const fromUrl = this.getLanguageFromUrl();
    if (fromUrl) {
      return fromUrl;
    }

    const storedLanguage = localStorage.getItem(Language.storageKey);
    if (storedLanguage === 'it' || storedLanguage === 'en') {
      return storedLanguage;
    }

    return navigator.language.toLowerCase().startsWith('it') ? 'it' : 'en';
  }

  private getLanguageFromUrl(): SupportedLanguage | null {
    const params = new URLSearchParams(this.document.location.search);
    const value = params.get(Language.langQueryParam);
    return value === 'it' || value === 'en' ? value : null;
  }

  private syncUrl(language: SupportedLanguage): void {
    const url = new URL(this.document.location.href);
    url.searchParams.set(Language.langQueryParam, language);
    window.history.replaceState({}, '', url);
  }
}
