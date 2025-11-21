import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-input-dropdown',
  templateUrl: './input-dropdown.component.html',
  styleUrls: ['./input-dropdown.component.scss'],
})
export class InputDropdownComponent {
  @Input()
  formGroup!: FormGroup;
  @Input()
  name: any;
  @Input()
  placeholder: any;

  @Input()
  key: any;

  @Input()
  value: any;

  @Input()
  disabled: any;

  @Input()
  object: any;

  @Output()
  change: EventEmitter<any> = new EventEmitter<any>();

  onchange(event: any) {
    this.change.emit(event);
  }

}
