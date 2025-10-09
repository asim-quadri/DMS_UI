import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeBlob',
})
export class SafeBlobPipe implements PipeTransform {
  constructor(protected sanitizer: DomSanitizer) {}

  public transform(value: any): any {
    return this.sanitizer.bypassSecurityTrustResourceUrl(value);
  }
}

@NgModule({
  declarations: [SafeBlobPipe],
  exports: [SafeBlobPipe],
})
export class SafeBlobModule {}
