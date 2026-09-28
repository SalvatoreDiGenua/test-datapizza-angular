import { Component, DestroyRef, computed, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  RequestLockDirective,
  RequestLockService,
  createRequestLockContext,
} from 'ngx-request-lock';
import { AuthService } from '../../api';
import { Auth } from '../../core/auth/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RequestLockDirective,
  ],
})
export class Login {
  private readonly requestLock = viewChild.required(RequestLockDirective);
  private readonly requestLockService = inject(RequestLockService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly loading = computed(() =>
    this.requestLockService.isPending(this.requestLock().requestId())(),
  );

  userIdControl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/^[a-zA-Z0-9_-]+$/),
      Validators.maxLength(30),
    ],
  });

  login(): void {
    if (this.userIdControl.invalid || this.loading()) {
      this.userIdControl.markAllAsTouched();
      return;
    }

    const userId = this.userIdControl.value;

    this.authService
      .loginApiAuthLoginPost({ user_id: userId }, 'body', false, {
        context: createRequestLockContext(this.requestLock().requestId()),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.auth.setUser({
            id: userId,
            email: 'test@datapizza.it',
          });

          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(returnUrl || '/shell/chat');
        },
      });
  }
}
