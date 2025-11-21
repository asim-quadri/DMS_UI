import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filter'
})
export class FilterPipe implements PipeTransform {
    transform(items: any[], value: any, key: string = '1'): any[] {
        if(key === '1') {
            return items;
        }
        return items.filter(item => item[key] === value);
    }
}
