import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { parse } from "date-fns";


export function fromToDate(
    fromDateField: string,
    toDateField: string,
    validatorField: { [key: string]: boolean }
): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
        const fromDate = parse(
            formGroup.get(fromDateField)!.value?.split('T')[0],

            'yyyy-MM-dd',
            new Date()
        );
        const toDate = parse(
            formGroup.get(toDateField)!.value?.split('T')[0],
            'yyyy-MM-dd',
            new Date()
        );
        if (fromDate != null && toDate != null && fromDate > toDate) {
            return validatorField;
        }
        return null;

    };
}