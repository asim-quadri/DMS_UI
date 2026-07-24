import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-input-text',
  templateUrl: './input-text.component.html',
  styleUrls: ['./input-text.component.scss']
})
export class InputTextComponent {


 @Input()
 formGroup: any;
 @Input()
 name: any;
 @Input()
 placeholder: any;
 @Input()
 readonly: any;
 @Input()
 label: string = '';
 @Input()
 labelClass: string = 'form-label';

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
