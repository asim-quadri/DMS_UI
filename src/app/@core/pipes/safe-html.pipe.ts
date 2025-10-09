import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(protected sanitizer: DomSanitizer) {}

  public transform(value: any): any {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}

@NgModule({
  declarations: [SafeHtmlPipe],
  exports: [SafeHtmlPipe],
})
export class SafeHtmlModule {}
