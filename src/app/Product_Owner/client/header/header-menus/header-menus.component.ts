import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header-menus',
  templateUrl: './header-menus.component.html',
  styleUrls: ['./header-menus.component.scss']
})
export class HeaderMenusComponent {
  
  @Input()
  active: number = 2;
}
