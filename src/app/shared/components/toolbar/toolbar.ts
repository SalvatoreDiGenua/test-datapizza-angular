import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';

import { Auth } from '../../../core/auth/auth';
import { ShellService } from '../../../core/services/shell/shell';
import { Avatar } from '../avatar/avatar';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    Avatar,
  ],
})
export class Toolbar {
  protected readonly auth = inject(Auth);

  private readonly router = inject(Router);
  private readonly shellService = inject(ShellService);

  public toggleShellDrawer(): void {
    this.shellService.isDrawerOpen.update((x) => !x);
  }

  public logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
