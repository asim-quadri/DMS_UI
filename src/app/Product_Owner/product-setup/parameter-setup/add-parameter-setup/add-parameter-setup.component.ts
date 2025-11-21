import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NotifierService } from 'angular-notifier';
import { PersistenceService } from '../../../../Services/persistence.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ParameterService } from 'src/app/Services/parameter.service';
import { ParameterModel } from 'src/app/Models/parameter';
import { ApiService } from 'src/app/Services/api.service';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { UsersModel } from 'src/app/Models/Users';

@Component({
  selector: 'app-add-parameter-setup',
  templateUrl: './add-parameter-setup.component.html',
  styleUrls: ['./add-parameter-setup.component.scss']
})
export class AddParameterSetupComponent {
  constructor(private fb: FormBuilder, public parameterService: ParameterService, private notifier: NotifierService, private persistance: PersistenceService) { }

  @Input()
  modal: any;

  @Input()
  users: UsersModel[] = [];

  @Output()
  public reloadPage: EventEmitter<string> = new EventEmitter<string>();

  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [''],
    parameterReferenceCode: [''],
    parameterName: ['', [
      RxwebValidators.required({ message: 'parameter name is required' })
    ]],
    numericparameter: ['Numeric', [Validators.required]],
    parameterType: [''],
  })

  onSubmit() {
    
    const isNumericChecked = this.formgroup.get('numericparameter')?.value
    if (this.formgroup.valid) {
      var parameter: ParameterModel = { ... this.formgroup.value };
      parameter.createdBy = this.persistance.getUserId()!;
      parameter.managerId = this.persistance.getManagerId()!;
      if (parameter.id == 0 || parameter.id == null) {
        parameter.id = 0;
        parameter.uid = null;

      }
      if (isNumericChecked == "Numeric") {
        parameter.parameterType = "Numeric"
      }

      if (isNumericChecked == "Yes/No") {
        parameter.parameterType = "Yes/No"
      }
      parameter.createdBy = this.persistance.getUserId()!;
      parameter.approvalManagerId = this.persistance.getManagerId();
      this.parameterService.addParameter(parameter).subscribe((result: ParameterModel) => {
        if (result.responseCode == 1) {
          this.notifier.notify("success", result.responseMessage);
          this.reloadPage.emit("reload");
          this.formgroup.reset();
        }
        else {
          this.notifier.notify("error", result.responseMessage);
        }

      }, error => {
        this.notifier.notify("error", "Some thing went wrong");
      });
    }
  }

  getActiveUsers() {
    return this.users.filter(f => f.status == 1);
  }
  async ngAfterViewInit() {
    await this.getNextParameterCode();
  }
  async getNextParameterCode() {
    try {
      const result = await this.parameterService.getNextParameterCode().toPromise();
        this.formgroup.get('parameterReferenceCode')?.setValue(result);
        this.formgroup.get('parameterReferenceCode')?.disable();
      
    } catch (error) {
      console.error('Error fetching next parameter reference Code', error);
    }
    
  }
 }
 
