import { Directive, HostListener } from '@angular/core';
import { AppConfig } from '../../app.config';

@Directive({
  selector: '[appNoRightClick]'
})
export class NoRightClickDirective {
  private appConfig = new AppConfig();

  @HostListener('contextmenu', ['$event'])
  onRightClick(e: any) {
    if (this.appConfig.production) {
      e.preventDefault();
    }
  }
  constructor() { }

}
