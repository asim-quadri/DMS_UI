import { Directive, HostListener, NgModule } from '@angular/core';

@Directive({
  selector: '[allowInt]',
})
export class AllowIntDirective {
  constructor() {}

  @HostListener('document:keypress', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'e' || event.key === '-') {
      event.preventDefault();
    }
  }
}

@NgModule({
  declarations: [AllowIntDirective],
  exports: [AllowIntDirective],
})
export class AllowIntDirectiveModule {}
