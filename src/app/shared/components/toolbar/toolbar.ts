import { Component, inject } from '@angular/core';
import { Auth } from '../../../core/auth/auth';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ShellService } from '../../../core/services/shell/shell';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.html',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
})
export class Toolbar {
  private readonly auth = inject(Auth);
  private readonly shellService = inject(ShellService);

  public toggleShellDrawer(): void {
    this.shellService.isDrawerOpen.update((x) => !x);
  }
}
