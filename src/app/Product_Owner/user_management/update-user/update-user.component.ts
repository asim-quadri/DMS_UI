import { formatDate } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  RxwebValidators,
  RxFormBuilder,
} from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { MenuOptionModel, UsersModel } from '../../../Models/Users';
import { RolesModels } from '../../../Models/roles';
import { ApiService } from '../../../Services/api.service';
import { fromToDate } from '../../../Validators/dateReange';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { Genders, UserRole } from 'src/app/enums/enums';
import { da } from 'date-fns/locale';
// Add this interface definition for IUniqueValidatorService
import { Observable, of } from 'rxjs';
import { filter } from 'underscore';
import { duplicateMobileValidator } from 'src/app/Validators/duplicateMobile';
import { DmsUserManagementService } from 'src/app/Services/dms-user-management.service';
import { PostDmsUser } from 'src/app/Models/dms.models';

export interface IUniqueValidatorService {
  getCurrentValue(fieldName: string, formData: any): any;
  getObjects(fieldName: string, formData: any): Observable<any[]>;
}

@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.scss'],
})
export class UpdateUserComponent implements OnChanges {
  genderOptions = Object.keys(Genders)
    .filter((key) => isNaN(Number(key)))
    .map((key) => ({
      id: Genders[key as keyof typeof Genders],
      label: key,
    }));

  mobileNumbers: UsersModel[] = [];
  isEditAction: boolean = false;
  @Input()
  users: UsersModel[] = [];

  @Input()
  public set selectedUsers(user: UsersModel) {
    console.log('selected user:', user);
    if (user.id != undefined) {
      user.startDate = formatDate(user.startDate!, 'yyyy-MM-dd', 'en-US');
      user.endDate = user.endDate
        ? formatDate(user.endDate, 'yyyy-MM-dd', 'en-US')
        : null;
      user.dateOfBirth = user.dateOfBirth
        ? formatDate(user.dateOfBirth!, 'yyyy-MM-dd', 'en-US')
        : null;
      this.formgroup.patchValue({ ...user });
      this.isEditAction = true;
    }
    var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');
    console.log('roleMenuOptions:', roleMenuOptions);
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 8
      var menuOptions = roleMenuOptions.filter(
        (option: MenuOptionModel) => option.parentId === 44
      );

      console.log('add/edit user setup Menu Options:', menuOptions);
      if (menuOptions.length > 0) {
        this.showSaveUserButton =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'Save User' && option.canView
          ).length > 0;
      }
    }
    
    // Always show Save User button by default, regardless of permissions
    this.showSaveUserButton = true;
  }

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  rolesData: RolesModels[] = [];
  showSaveUserButton: boolean = false;
  formgroup: FormGroup = this.fb.group(
    {
      uid: [''],
      id: [''],
      fullName: [
        '',
        [RxwebValidators.required({ message: 'Full name is required' })],
      ],
      empId: [
        '',
        RxwebValidators.required({ message: 'Employee id is required' }),
      ],
      email: [
        '',
        [
          RxwebValidators.required({ message: 'Email address is required' }),
          RxwebValidators.email({ message: 'Invalid Email Address' }),
        ],
      ],
      mobile: [
        '',
        RxwebValidators.required({ message: 'mobileNo is required' }),
      ],
      roleId: ['', RxwebValidators.required({ message: 'Select the Role Id' })],
      startDate: [
        '',
        RxwebValidators.required({ message: 'Start Date is required' }),
      ],
      endDate: [null],
      managerId: [
        '',
        RxwebValidators.required({ message: 'Select the Manger' }),
      ],
      dateOfBirth: [
        '',
        RxwebValidators.required({ message: 'Date of Birth is required' }),
      ],
      gender: [, RxwebValidators.required({ message: 'gender is required' })],
    },
    {
      validators: [fromToDate('startDate', 'endDate', { oaddate: true })],
    }
  );

  constructor(
    private fb: FormBuilder,
    public apiService: ApiService,
    private notifier: NotifierService,
    private persistance: PersistenceService,
    private dmsUserService: DmsUserManagementService
  ) {
    this.getAllRoles();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.users) {
      this.mobileNumbers = this.users.filter((user) => user.mobile);
    }
  }

  onSubmit() {
    if (!this.formgroup.valid) {
      return;
    }
    var user: UsersModel = { ...this.formgroup.value };
    if (user.id == 0 || user.id == null) {
      user.id = 0;
      user.uid = null;
    }
    user.endDate = user.endDate == '' ? null : user.endDate;
    user.createdBy = this.persistance.getUserId()!;
    user.approvalManagerId = this.persistance.getManagerId();

    this.submitDmsUser(user);
  }

  private submitDmsUser(user: UsersModel): void {
    const payload: PostDmsUser = {
      Id: user.id || undefined,
      EmpId: user.empId,
      FullName: user.fullName,
      Email: user.email,
      Mobile: user.mobile,
      RoleId: user.roleId,
      StartDate: user.startDate,
      EndDate: user.endDate || undefined,
      ManagerId: user.managerId,
      ApprovalManagerId: user.approvalManagerId,
      CreatedBy: user.createdBy,
      ModifiedBy: this.isEditAction ? this.persistance.getUserId()! : undefined,
      DateOfBirth: user.dateOfBirth || undefined,
      Gender: user.gender as any,
      OrganizationId: this.persistance.getOrganizationId(),
      Status: 1
    };

    const request$ = this.isEditAction
      ? this.dmsUserService.updateDmsUser(payload)
      : this.dmsUserService.addDmsUser(payload);

    request$.subscribe({
      next: () => {
        this.notifier.notify('success', this.isEditAction ? 'User updated successfully' : 'User created successfully');
        this.reloaddata.emit('reload');
        this.isEditAction = false;
        this.formgroup.reset();
      },
      error: () => this.notifier.notify('error', 'Something went wrong')
    });
  }
  reset() {
    this.formgroup.reset();
    this.isEditAction = false;
  }

  getAllRoles() {
    this.dmsUserService.getAllDmsRoles().subscribe((result: any) => {
      this.rolesData = (result || []).map((r: any) => ({
        id: r.id ?? r.Id,
        roleId: r.id ?? r.Id,
        roleName: r.roleName ?? r.RoleName,
        roleDisplayName: r.roleDisplayName ?? r.RoleDisplayName,
        description: r.description ?? r.Description,
        status: r.status ?? r.Status,
        uid: r.uid ?? r.UID
      }));
    });
  }

  validateMobileNumber(event: any) {
    const mobileNumber = event.target.value;
    const mobile = this.formgroup.get('mobile');

    const existingMobiles = this.users
      .map((u) => u.mobile)
      .filter((m): m is string => !!m);

    const isDuplicate = existingMobiles.includes(mobileNumber);

    if (isDuplicate) {
      mobile?.setValidators([duplicateMobileValidator(existingMobiles)]);
    } else {
      mobile?.clearValidators();
    }

    mobile?.updateValueAndValidity();
    mobile?.markAsTouched();
  }

  validateCurrentDates(event: any) {
    const startDate = this.formgroup.get('startDate');
    const endDate = this.formgroup.get('endDate');
    if (
      formatDate(endDate?.value, 'yyyy-MM-dd', 'en') <
      formatDate(startDate?.value, 'yyyy-MM-dd', 'en')
    ) {
      endDate?.clearValidators();
      endDate?.setValidators([
        // RxwebValidators.required({ message: 'End Date is required' }),
        RxwebValidators.maxDate({
          fieldName: 'startDate',
          message: 'End date cannot be prior to start date',
        }),
      ]);
    } else {
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
            message: 'End Date is required',
          }),
        ]);
      }
      if (endDate?.value == '' && startDate?.value == '') {
        endDate?.clearValidators();
        startDate?.clearValidators();
      }
    }
    startDate?.updateValueAndValidity();
    startDate?.markAsTouched();
    endDate?.updateValueAndValidity();
    endDate?.markAsTouched();
  }

  getActiveUsers() {
    return this.users.filter((f) => f.status == 1 && f.roleName != 'User');
  }
}
