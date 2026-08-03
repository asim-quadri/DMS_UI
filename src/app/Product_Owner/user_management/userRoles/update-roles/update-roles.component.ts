import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { MenuOptionModel, UsersModel } from 'src/app/Models/Users';
import { RolesModels, UpdateRoleModels } from 'src/app/Models/roles';
import { ApiService } from 'src/app/Services/api.service';
import { PersistenceService } from '../../../../Services/persistence.service';
import { DmsUserManagementService } from 'src/app/Services/dms-user-management.service';
import { PostDmsRole } from 'src/app/Models/dms.models';

@Component({
  selector: 'app-update-roles',
  templateUrl: './update-roles.component.html',
  styleUrls: ['./update-roles.component.scss']
})
export class UpdateRolesComponent {
  
  @Input()
  roles: UpdateRoleModels[] = [];

  @Input()
  users: UsersModel[] = [];

  @Input()
  public set selectedUsers(role: RolesModels) {
    if (role) {
       this.formgroup.patchValue({...role});
    }
  }

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  rolesData: RolesModels[] = [];
  showSaveButton: boolean = false;
  // if (roles) {
  //   
  //    user.startDate = formatDate(user.startDate!, 'yyyy-MM-dd','en-US');
  //    user.endDate = formatDate(user.endDate!, 'yyyy-MM-dd','en-US');
  //    this.formgroup.patchValue({...user});
  // }

  formgroup :FormGroup = this.fb.group({
    uid: [{ value: '' }],
    id: [{ value: '', disabled: false }],
    roleDisplayName:['', RxwebValidators.required({ message: 'Role Name is required' })],
    managerId: ['']
  });

  constructor(private fb: FormBuilder, public apiService: ApiService, private notifier:NotifierService, private persistance: PersistenceService, private dmsUserService: DmsUserManagementService){
    this.getAllRoles() 
    this.getAllUser()
    this.getActiveUsers()

    var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 43
      var menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 43);
      console.log('Roles setup Menu Options:', menuOptions);
      if (menuOptions.length > 0) {
        this.showSaveButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Save changes' && option.canView).length > 0;}
    }
    
    // Always show Save button by default, regardless of permissions
    this.showSaveButton = true;
  }


  // updateRole(_data : any){
  //   var reqOBJ = this.updateroles.value;
  //   this.apiService.updateRoles(reqOBJ).subscribe((response: any) => {
  //     if(response.Status == 'suucess')
  //     {}
  //     else{

  //     }
  //   });
  // }

  onSubmit(){
    if(!this.formgroup.valid){
      return;
    }
    var roles: UpdateRoleModels = {... this.formgroup.value};
    let user = this.persistance.getSessionStorage('currentUser');
    roles.managerId =user.managerId;
    roles.createdBy = user.id;
    this.formgroup.value.Id = user.id;
    this.formgroup.value.managerId = user.managerId;

    this.submitDmsRole(user);
  }

  private submitDmsRole(currentUser: any): void {
    const formValue = this.formgroup.value;
    const isEdit = !!formValue.id;
    const payload: PostDmsRole = {
      Id: formValue.id || undefined,
      RoleDisplayName: formValue.roleDisplayName,
      ManagerId: currentUser?.managerId,
      ApprovalManagerId: currentUser?.managerId,
      CreatedBy: currentUser?.id,
      ModifiedBy: isEdit ? currentUser?.id : undefined,
      UID: formValue.uid || undefined,
      Status: 1
    };

    const request$ = isEdit
      ? this.dmsUserService.updateDmsRole(payload)
      : this.dmsUserService.addDmsRole(payload);

    request$.subscribe({
      next: () => {
        this.notifier.notify('success', isEdit ? 'Role updated successfully' : 'Role created successfully');
        this.reloaddata.emit('reload');
        this.formgroup.reset();
      },
      error: () => this.notifier.notify('error', 'Something went wrong')
    });
  }

  getAllRoles(){
    this.dmsUserService.getAllDmsRoles().subscribe((result: any) => {
      this.rolesData = (result || []).map((r: any) => ({
        id: r.id ?? r.Id,
        roleName: r.roleName ?? r.RoleName,
        roleDisplayName: r.roleDisplayName ?? r.RoleDisplayName,
        status: r.status ?? r.Status,
        uid: r.uid ?? r.UID
      }));
    });
  }

  getAllUser(){
    const organizationId = this.persistance.getOrganizationId();
    this.dmsUserService.getAllDmsUsers(organizationId!).subscribe((result: any) => {
      this.users = (result || []).map((u: any) => ({
        id: u.id ?? u.Id,
        fullName: u.fullName ?? u.FullName,
        status: u.status ?? u.Status
      }));
    });
  }

  getActiveUsers(){
    return this.users.filter(f=>f.status == 1);

  }
}