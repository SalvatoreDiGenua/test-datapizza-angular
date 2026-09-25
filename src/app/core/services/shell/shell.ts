import { inject, Injectable, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDrawerMode } from '@angular/material/sidenav';

@Injectable({
  providedIn: 'root',
})
export class ShellService {
  public readonly isDrawerOpen = signal(true);
  public readonly drawerMode = signal<MatDrawerMode>('side');

  private readonly breakpointObserver = inject(BreakpointObserver);

  constructor() {
    this.breakpointObserver
      .observe('(max-width: 599px)')
      .subscribe(({ matches }) => {
        if (matches) {
          // Small
          this.isDrawerOpen.set(false);
          this.drawerMode.set('over');
        } else {
          // Medium / Large
          this.isDrawerOpen.set(true);
          this.drawerMode.set('side');
        }
      });
  }
}
