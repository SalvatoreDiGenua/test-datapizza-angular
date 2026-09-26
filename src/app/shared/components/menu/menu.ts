import { Component, inject } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.html',
  imports: [MatListModule, MatDividerModule, RouterLink, RouterLinkActive],
})
export class Menu {
  protected readonly route = inject(ActivatedRoute);
}
