import { NgModule, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeHtml',
})
export class RemoveHtmlPipe implements PipeTransform {
  public transform(value: any, ...args: any[]) {
    return value.replace('<br/>', ' ');
  }
}

@NgModule({
  declarations: [RemoveHtmlPipe],
  exports: [RemoveHtmlPipe],
})
export class RemoveHtmlPipeModule {}
