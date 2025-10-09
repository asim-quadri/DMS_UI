import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { Constant } from '../utils/constant';

@Pipe({
  name: 'isShowTooltip',
})
export class IsShowTooltip implements PipeTransform {
  public transform(
    value: any,
    toolTipMaxLength: number = Constant.toolTipMaxLength
  ) {
    return value?.length > toolTipMaxLength ? value : '';
  }
}

@NgModule({
  declarations: [IsShowTooltip],
  exports: [IsShowTooltip],
})
export class IsShowTooltipModule {}
