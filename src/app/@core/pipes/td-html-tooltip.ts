import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { ITh } from '@app/partial/table/vat-table/table-model';
import { Constant } from '../utils/constant';

@Pipe({
  name: 'tdHtmlTooltip',
})
export class TdHtmlTooltipPipe implements PipeTransform {
  constructor() {}

  public transform(
    value: string,
    th: ITh,
    data: any,
    toolTipMaxLength: number = Constant.toolTipMaxLength
  ): any {
    let res = '';
    try {
      const _result = data[th.thKeyName.replace('_html', '')];
      res = _result?.length > toolTipMaxLength ? _result : '';
    } catch (ex) {
      res = '';
    }
    return res;
  }
}

@NgModule({
  declarations: [TdHtmlTooltipPipe],
  exports: [TdHtmlTooltipPipe],
})
export class TdHtmlTooltipPipeModule {}
