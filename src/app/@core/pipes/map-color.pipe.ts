import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'mapColor'
})
export class MapColorPipe implements PipeTransform {
    transform(items: any[], statusColor: number, colorKey: string = 'color'): any[] {
        if(statusColor === -1) {
            return items;
        }
        if (!Array.isArray(items)) {
            return items;
        }
        return items.filter(item => item[colorKey] === statusColor);
    }
}
