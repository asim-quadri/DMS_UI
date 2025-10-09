import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgModule,
  OnChanges,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appChkScroll]',
})
export class ChkScrollEndDirective implements OnChanges {
  @Input() isApiLoad = false;
  @Output() emitEndScroll = new EventEmitter();
  @Input() addHeight = 100;
  @Input() isScrollDown = false;
  @Input() isScrollUp = false;
  @Input() isScrollToStartPosition = false;

  constructor(private el: ElementRef) {}
  @HostListener('scroll', ['$event']) onScroll(e: any) {
    if (
      e.target.scrollTop + e.target.offsetTop + Number(this.addHeight) >=
        e.target.scrollHeight &&
      this.isApiLoad
    ) {
      this.emitEndScroll.emit();
    }
  }

  ngOnChanges() {
    if (this.isScrollDown) {
      this.el.nativeElement.scrollTop = this.el.nativeElement.scrollTop + 30;
    }
    if (this.isScrollUp) {
      this.el.nativeElement.scrollTop = this.el.nativeElement.scrollTop - 30;
    }
    if (this.isScrollToStartPosition) {
      this.el.nativeElement.scrollTo({ behavior: 'smooth', top: 0 });
    }
  }
}

@NgModule({
  declarations: [ChkScrollEndDirective],
  exports: [ChkScrollEndDirective],
})
export class ChkScrollEndModule {}
