import { Service, signal } from '@angular/core';

export interface ApiErrorState {
  status: number;
  message: string;
  url: string;
}

@Service()
export class ApiError {
  readonly error = signal<ApiErrorState | null>(null);

  report(error: ApiErrorState): void {
    this.error.set(error);
  }

  clear(): void {
    this.error.set(null);
  }
}
