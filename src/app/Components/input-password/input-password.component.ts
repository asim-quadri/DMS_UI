import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-input-password',
  templateUrl: './input-password.component.html',
  styleUrls: ['./input-password.component.scss']
})
export class InputPasswordComponent {
  @Input()
  formGroup: any;
  @Input()
  name: any;
  @Input()
  placeholder: any;
}
