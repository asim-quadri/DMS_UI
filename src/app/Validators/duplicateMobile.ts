import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function duplicateMobileValidator(existingMobiles: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const isDuplicate = existingMobiles.includes(value);
    return isDuplicate ? { duplicate: { message: 'Mobile number already exists' } } : null;
  };
}