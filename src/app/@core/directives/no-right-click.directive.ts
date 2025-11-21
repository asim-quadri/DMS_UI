import { Directive, HostListener } from '@angular/core';
import { environment } from 'src/environments/environment';

@Directive({
  selector: '[appNoRightClick]'
})
export class NoRightClickDirective {
  @HostListener('contextmenu', ['$event'])
  onRightClick(e: any) {
    if (environment.production) {
      e.preventDefault();
    }
  }
  constructor() { }

}
