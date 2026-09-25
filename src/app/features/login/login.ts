import { Component, DestroyRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  createRequestLockContext,
  RequestLockDirective,
} from 'ngx-request-lock';
import { AuthService } from '../../api';
import { Auth } from '../../core/auth/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    RequestLockDirective,
  ],
})
export class Login {
  private readonly requestLock = viewChild(RequestLockDirective);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  userIdControl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/^[a-zA-Z0-9_-]+$/),
      Validators.maxLength(30),
    ],
  });

  login() {
    if (this.userIdControl.invalid) {
      this.userIdControl.markAllAsTouched();
      return;
    }

    const userId = this.userIdControl.value;

    this.authService
      .loginApiAuthLoginPost({ user_id: userId }, 'body', false, {
        context: createRequestLockContext(
          this.requestLock()?.requestId() as string,
        ),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.auth.setUser({
            id: userId,
            email: 'test@datapizza.it',
          });

          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          console.log({ returnUrl });

          this.router.navigateByUrl(returnUrl || '/shell/chat');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Errore durante il login:', err);
          const errorMessage = err.error.detail[0].msg;
          this.snackBar.open(errorMessage);
        },
      });
  }
}
