import { Directive, HostListener } from '@angular/core';
import { environment } from 'src/environments/environment';

@Directive({
  selector: '[appNoF12]'
})
export class NoF12Directive {

  constructor() { }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (environment.production && event.key === 'F12') {
      event.preventDefault();
    }
  }
}
