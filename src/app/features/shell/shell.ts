import { Component, inject } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { Toolbar } from '../../shared/components/toolbar/toolbar';
import { ShellService } from '../../core/services/shell/shell';
import { Menu } from '../../shared/components/menu/menu/menu';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  imports: [RouterOutlet, MatSidenavModule, Toolbar, Menu, MatCardModule],
})
export class Shell {
  protected readonly shellService = inject(ShellService);
}
