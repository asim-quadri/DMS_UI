import { formatDate } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RxwebValidators, RxFormBuilder } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { UsersModel } from '../../../models/Users';
import { RolesModels } from '../../../models/roles';
import { ApiService } from '../../../Services/api.service';
import { fromToDate } from '../../../Validators/dateReange';
import { PersistenceService } from '../../../Services/persistence.service';
import { UserRole } from '../../../enums/enums';



@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.scss']
})
export class UpdateUserComponent {

  @Input()
  users: UsersModel[] = [];

  @Input()
  public set selectedUsers(user: UsersModel) {
    if (user.id != undefined) {
      user.startDate = formatDate(user.startDate!, 'yyyy-MM-dd', 'en-US');
      user.endDate = formatDate(user.endDate!, 'yyyy-MM-dd', 'en-US');
      this.formgroup.patchValue({ ...user });
    }
  }

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  rolesData: RolesModels[] = [];

  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [''],
    fullName: ['', [
      RxwebValidators.required({ message: 'Full name is required' })
    ]],
    empId: ['', RxwebValidators.required({ message: 'Employee id is required' }),],
    email: ['', [
      RxwebValidators.required({ message: 'Email address is required' }),
      RxwebValidators.email({ message: "Invalid Email Address" })
    ]],
    mobile: ['', RxwebValidators.required({ message: 'Mobile is required' })],
    roleId: ['', RxwebValidators.required({ message: 'Select the Role Id' })],
    startDate: ['', RxwebValidators.required({ message: 'Start Date is required' })],
    endDate: [''],
    managerId: ['', RxwebValidators.required({ message: 'Select the Manger' })]
  },
    {
      Validators: [
        fromToDate('startDate', 'endDate', { oaddate: true })
      ]
    }
  );






  constructor(private fb: FormBuilder, public apiService: ApiService, private notifier: NotifierService, private persistance: PersistenceService) {
    this.getAllRoles();
  }

  onSubmit() {

    if (this.formgroup.valid) {
      var user: UsersModel = { ... this.formgroup.value };
      if (user.id == 0 || user.id == null) {
        user.id = 0;
        user.uid = null;

      }
      user.endDate = (user.endDate == "" ? null : user.endDate);
      user.createdBy = this.persistance.getUserId()!;
      user.approvalManagerId = this.persistance.getManagerId();
      this.apiService.postUser(user).subscribe((result: UsersModel) => {
        if (result.responseCode == 1) {
          this.notifier.notify("success", result.responseMessage);
          this.reloaddata.emit('reload');
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


  getAllRoles() {
    this.apiService.getAllRoles().subscribe((result: RolesModels[]) => {
      this.rolesData = result.filter(f => f.roleName != UserRole.SuperAdmin && f.roleName != UserRole.ITSupportAdmin);
    });
  }


  validateCurrentDates(event: any) {

    const startDate = this.formgroup.get("startDate");
    const endDate = this.formgroup.get('endDate');
    if (formatDate(endDate?.value, 'yyyy-MM-dd', 'en') < formatDate(startDate?.value, 'yyyy-MM-dd', 'en')) {
      endDate?.clearValidators();
      endDate?.setValidators([
        RxwebValidators.required({ message: 'End Date is required' }),
        RxwebValidators.maxDate({
          fieldName: 'startDate',
          message: 'End date cannot be prior to start date'
        }),
      ]);
    }
    else {
      endDate?.clearValidators();
      startDate?.clearValidators();
      if (endDate?.value == '' || startDate?.value == '') {
        startDate?.setValidators([
          RxwebValidators.required({ message: 'Start Date is required' }),
        ]);
      }
      if (endDate?.value == '' || startDate?.value != '') {
        endDate?.setValidators([
          RxwebValidators.required({
            message: 'End Date is required'
          }),
        ]);
      }
      if (endDate?.value == '' && startDate?.value == '') {
        endDate?.clearValidators(); startDate?.clearValidators();
      }
    }
    startDate?.updateValueAndValidity();
    startDate?.markAsTouched(); endDate?.updateValueAndValidity();
    endDate?.markAsTouched();

  }

  getActiveUsers() {
    return this.users.filter(f => f.status == 1 && f.roleName != 'User');
  }
}
