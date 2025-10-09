import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RxwebValidators, disable } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { pendingApproval, accessModel } from '../../../../models/pendingapproval';
import { RolesModels } from  '../../../../models/roles';
import { ApiService } from  '../../../../Services/api.service';
import { fromToDate } from  '../../../../Validators/dateReange';
import { UsersModel } from '../../../../models/Users';

@Component({
  selector: 'app-review-role',
  templateUrl: './review-role.component.html',
  styleUrls: ['./review-role.component.scss']
})
export class ReviewRoleComponent {
  constructor(private modalService: NgbModal, private fb: FormBuilder, public apiService: ApiService,private notifier: NotifierService) { }
  @Input()
  modal: any;
  roles: RolesModels = {};
  rolesData: RolesModels[] = [];
  users: UsersModel = {};
  @Input()
  pendingRoleApproval: pendingApproval | undefined;

  @Output()
  reloadPage:EventEmitter<any> = new EventEmitter<any>();

  access: accessModel | undefined;

  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [''],
    roleName: [{ value: '', disabled: true} ],
    roleDisplayName:[{ value: '', disabled: true} ],
  },
);

ngOnInit(): void {
  this.getRoleByUID();
}

getRoleByUID() {
  this.rolesData = [];
  this.apiService.getHistoryRoleByUID(this.pendingRoleApproval?.historyId).subscribe((result: RolesModels) => {
    //this.users = result;
    this.formgroup.patchValue({
      uid: result.uid,
      id: result.id,
      roleName:result.roleName,
      roleDisplayName: result.roleDisplayName,

      roleId: result.roleId,
      //managerId: result.managerName
    });
  });
}


submitApproved() {

  this.bindData();
  this.apiService.submitRoleApproved(this.access!).subscribe((result: any) => {
    if(result){
      this.notifier.notify("success", "Saved Successfully");
      this.reloadPage.emit("close");
    }
    else{
      this.notifier.notify("error", "Some Thing went wrong");
    }

  });
}

bindData() {
  this.access = {
    userId : this.users.id!,
    managerId : this.pendingRoleApproval?.approverManager!,
    productMappingId : this.pendingRoleApproval?.productMappingId!,
    ApprovalTypeId : this.pendingRoleApproval?.approvalTypeId!,
    uid:this.pendingRoleApproval?.approverUID!,
    createdBy : 1,
    id:this.pendingRoleApproval?.id,
    historyId: this.pendingRoleApproval?.historyId

  }
}

submitReject() {
  this.bindData();
  this.apiService.submitReject(this.access!).subscribe((result: any) => {

    if(result){
      this.notifier.notify("success", "Saved Successfully");
      this.reloadPage.emit("close");
    }
    else{
      this.notifier.notify("error", "Some Thing went wrong");
    }
  });
}
}
