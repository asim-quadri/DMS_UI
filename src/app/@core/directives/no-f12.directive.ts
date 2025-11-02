import { Directive, HostListener } from '@angular/core';
import { AppConfig } from '../../app.config';

@Directive({
  selector: '[appNoF12]'
})
export class NoF12Directive {
  private appConfig = new AppConfig();

  constructor() { }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.appConfig.production && event.key === 'F12') {
      event.preventDefault();
    }
  }
}
