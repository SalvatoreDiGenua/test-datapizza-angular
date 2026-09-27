import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
  imports: [MatIconModule, RouterLink, RouterLinkActive],
})
export class Menu {
  protected readonly route = inject(ActivatedRoute);
}
