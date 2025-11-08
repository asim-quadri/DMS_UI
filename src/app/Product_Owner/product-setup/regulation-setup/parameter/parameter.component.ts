import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ParameterModel } from 'src/app/Models/parameter';
import { RegSetupComplianceParameterHistory } from 'src/app/Models/regulationsetupModel';
import { ParameterService } from 'src/app/Services/parameter.service';


@Component({
  selector: 'app-parameter',
  templateUrl: './parameter.component.html',
  styleUrls: ['./parameter.component.scss']
})
export class ParameterComponent implements OnInit {
  shownumeric: boolean = false;
  numericOperators: boolean[] = [];
  @Input()
  inReview: boolean = false;

  @Input()
  isParameterchecked: boolean = false;
  @Input()
  parameterObject: RegSetupComplianceParameterHistory[] = []
  parametersDropdown: ParameterModel[] = [];
  @Output() parametersChange = new EventEmitter<FormArray>();
  @Output() formValidityChange = new EventEmitter<boolean>();

  constructor(
    private fb: FormBuilder,
    private parameterService: ParameterService
  ) { }

  formGroup1: FormGroup = this.fb.group({
    parameters: this.fb.array([]),
  });

  ngOnInit() {
    this.getParamerterDropdown();
    
   
  }

  updateParameterForm() {
    setTimeout(() => {
      if (this.parameterObject && this.parameterObject.length > 0) {
        this.parameters = this.fb.array([]);
        this.parameterObject.forEach(element => {
          this.parameters.push(
            this.fb.group({
              uid: [element.uid],
              id: [element.id],
              parameterTypeId: [element.parameterTypeId, Validators.required],
              parameterTypeValue: [element.parameterTypeValue, Validators.required],
              parameterOperator: [element.parameterOperator, Validators.required],
              historyId: [element.historyId],
              isNumericType: [this.parametersDropdown.find(f => f.id == element.parameterTypeId)?.parameterType == 'Numeric' ? true : false]
            })
          );
          this.numericOperators.push(this.parametersDropdown.find(f => f.id == element.parameterTypeId)?.parameterType == 'Numeric' ? true : false);
        });
        this.formGroup1.updateValueAndValidity();
      } else {
        if (this.parameters.length <= 0) {
          this.addParameter();
        }
      }
    }, 1500);
  }

  createParameterGroup(): FormGroup {
    return this.fb.group({
      uid: [null],
      id: [0],
      parameterTypeId: ['', Validators.required],
      parameterTypeValue: ['Yes', Validators.required],
      parameterOperator: ['AND', Validators.required],
      historyId: [0],
      isNumericType: [false]
    });
  }

  get parameters(): FormArray {
    return this.formGroup1.get('parameters') as FormArray;
  }

  set parameters(params: FormArray) {
    this.formGroup1.setControl('parameters', params);
  }

  getParamerterDropdown() {
    this.parameterService.getAllParameters().subscribe((result: any) => {
      this.parametersDropdown = result;
      this.updateParameterForm();
    });
  }

  addParameter(): void {
    const parameterGroup = this.createParameterGroup();
    this.parameters.push(parameterGroup);
    this.parametersChange.emit(this.parameters);
    this.emitFormValidity();
    this.numericOperators.push(false);
  }

  parameterChange() {
    
    this.parametersChange.emit(this.parameters);
    this.emitFormValidity();
  }

  parameterTypeValuechange(event: any, index: number) {
    const selectedValue = event.target.value;
    const selectedParameter = this.parametersDropdown.find(option => option.id == selectedValue);
    if (selectedParameter) {
      this.numericOperators[index] = selectedParameter.parameterType == 'Numeric' ? true : false;
    }
    const type = this.parametersDropdown.find(f => f.id == selectedValue)?.parameterType;
    const parameterValueControl = this.parameters.at(index).get('parameterTypeValue') as FormControl;
    if (type === 'Yes/No') {
      parameterValueControl.setValue('Yes'); // Default to 'Yes' for radio buttons
    } else {
      parameterValueControl.setValue(''); // Reset value for text input
    }
    this.parameters.at(index).get('isNumericType')?.setValue(type === 'Numeric');
  }

  isBooleanParameter(index: number): boolean {
    return this.parameters.at(index).get('isNumericType')?.value;
  }

  isNumericOperator(index: number, value: any): boolean {
    return this.parameters.at(index).get('isNumericType')?.value;
  }

  removeParameter(index: number): void {
    this.parameters.removeAt(index);
    this.emitFormValidity();
    this.numericOperators.splice(index, 1);
  }

  onSubmit() {
    if (this.formGroup1.valid) {
      console.log(this.formGroup1.value);
    }
  }

  emitFormValidity(): void {
    this.formValidityChange.emit(this.parameters.valid);
  }
}
