import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-input-date',
  templateUrl: './input-date.component.html',
  styleUrls: ['./input-date.component.scss']
})
export class InputDateComponent {

  @Input()
  formGroup: any;
  @Input()
  name: any;
  @Input()
  placeholder: any;

  @Output()
  change: EventEmitter<any> = new EventEmitter<any>();

  onchange(event:any){
    this.change.emit(event);
  }
}
