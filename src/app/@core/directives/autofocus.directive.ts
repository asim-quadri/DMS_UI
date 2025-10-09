import { AfterViewInit, Directive, ElementRef, NgModule } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
})
export class AutoFocusDirective implements AfterViewInit {
  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    this.elementRef.nativeElement.focus();
  }
}

@NgModule({
  declarations: [AutoFocusDirective],
  exports: [AutoFocusDirective],
})
export class AutoFocusModule {}
