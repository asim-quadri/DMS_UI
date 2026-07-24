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
  @Input()
  label: string = '';
  @Input()
  labelClass: string = 'form-label';
  @Input()
  showPassword: boolean = false;
  togglePassword()
  {
    this.showPassword = !this.showPassword;
  }

  onAutofillAnimation(event: AnimationEvent, input: HTMLInputElement) {
    if (event.animationName !== 'onAutoFillStart') {
      return;
    }
    const control = this.formGroup?.controls?.[this.name];
    if (control && control.value !== input.value) {
      control.setValue(input.value);
      control.markAsDirty();
      control.markAsTouched();
    }
  }
}
