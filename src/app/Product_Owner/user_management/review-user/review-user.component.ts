import { Component, EventEmitter, Input, OnInit, Optional, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RxwebValidators, disable } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { Observable } from 'rxjs';
import { UsersModel } from 'src/app/Models/Users';
import { pendingApproval, accessModel } from 'src/app/Models/pendingapproval';
import { RolesModels } from 'src/app/Models/roles';
import { ApiService } from 'src/app/Services/api.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { fromToDate } from 'src/app/Validators/dateReange';
import { UserRole } from 'src/app/enums/enums';

@Component({
  selector: 'app-review-user',
  templateUrl: './review-user.component.html',
  styleUrls: ['./review-user.component.scss']
})
export class ReviewUserComponent implements OnInit {
  managerid: number = 0;
  constructor(private modalService: NgbModal, private fb: FormBuilder,
    public apiService: ApiService, private notifier: NotifierService, private persistance: PersistenceService,@Optional() public activeModal: NgbActiveModal,
    public persistanceService: PersistenceService) {
    this.getAllRoles();
  }
  @Input()
  modal: any;
	
  @Input()
  usersList: UsersModel[] = [];
  enable: boolean = false;

  users: UsersModel = {};

  rolesData: RolesModels[] = [];
  @Input()
  pendingUserApproval: pendingApproval | undefined;

  @Output()
  reloadPage: EventEmitter<any> = new EventEmitter<any>();

  access: accessModel | undefined;
  

  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [''],
    fullName: [{ value: '', disabled: true }, [
      RxwebValidators.required({ message: 'Full name is required' })
    ]],
    empId: [{ value: '', disabled: true }, RxwebValidators.required({ message: 'Employee id is required' }),],
    email: [{ value: '', disabled: true }, [
      RxwebValidators.required({ message: 'Email address is required' }),
      RxwebValidators.email({ message: "Invalid Email Address" })
    ]],
    mobile: [{ value: '', disabled: true }, RxwebValidators.required({ message: 'Mobile is required' })],
    roleId: [{ value: '', disabled: true }, RxwebValidators.required({ message: 'Select the Role Id' })],
    startDate: [{ value: '', disabled: true }, RxwebValidators.required({ message: 'Start Date is required' })],
    endDate: [{ value: '', disabled: true }, RxwebValidators.required({ message: 'End Date is required' })],
    managerId: [{ value: '', disabled: true }, RxwebValidators.required({ message: 'Select the Manger' })]
  },
    {
      Validators: [
        fromToDate('startDate', 'endDate', { oaddate: true })
      ]
    }
  );



  ngOnInit(): void {
    this.getManagerId();
    this.getUserByUID();

  }

  enablefields() {
    this.formgroup.enable();
    this.enable = true;

  }

  disablefields() {
    this.formgroup.disable();
    this.enable = false;

  }



  onSubmit() {



    if (this.formgroup.valid) {
      var user: UsersModel = { ... this.formgroup.value };
      if (user.id == 0 || user.id == null) {
        user.id = 0;
        user.uid = null;

      }
      user.createdBy = this.persistance.getUserId()!;
      user.approvalManagerId = this.persistance.getManagerId();

      this.apiService.postUser(user, this.pendingUserApproval?.approverUID!).subscribe((result: UsersModel) => {
        if (result.responseCode == 1) {
          this.notifier.notify("success", "Saved Successfully");
       
          this.formgroup.reset();
        }
        else {
          this.notifier.notify("error", result.responseMessage);
        }

      }, error => {
        this.notifier.notify("error", "Some thing went wrong");
      });
      
      this.bindData();
      setTimeout(() => {
        if (this.persistance.getManagerId()! > 0) {
          this.apiService.submitForward(this.access!).subscribe((result:any)=>{
            this.reloadPage.emit('reload');
          });
        }
        else {
          this.apiService.submitApproved(this.access!).subscribe((result:any)=>{
            this.reloadPage.emit('reload');
          });
        }
      }, 200);

    }
  }


  getAllRoles() {
    this.apiService.getAllRoles().subscribe((result: any) => {
      this.rolesData = result.filter((f: any) => f.roleName != UserRole.SuperAdmin && f.roleName != UserRole.ITSupportAdmin);
    });
  }

  getUserByUID() {
    this.rolesData = [];
    this.apiService.getHistoryUserByID(this.pendingUserApproval?.historyId).subscribe((result: UsersModel) => {
      this.users = result;
      
      this.formgroup.patchValue({
        uid: result.uid,
        id: result.id,
        fullName: result.fullName,
        empId: result.empId,
        email: result.email,
        mobile: result.mobile,
        roleId: result.roleId,
        startDate: result.startDate?.split('T')[0],
        endDate: result.endDate?.split('T')[0],
        managerId: result.managerId
      });
    });
  }

  submitApproved() {
    this.bindData();
    if (this.persistance.getRole() == UserRole.Reviewer) {
      this.apiService.submitReviewed(this.access!).subscribe((result: any) => {
        if (result) {
          this.notifier.notify("success", "Saved Successfully");
          this.reloadPage.emit("close");
        }
        else {
          this.notifier.notify("error", "Some Thing went wrong");
        }

      });
    }
    else {
      this.apiService.submitApproved(this.access!).subscribe((result: any) => {
        if (result) {
          this.notifier.notify("success", "Saved Successfully");
          this.reloadPage.emit("close");
        }
        else {
          this.notifier.notify("error", "Some Thing went wrong");
        }

      });
    }



  }

  bindData() {
    this.access = {
      userId: this.users.id!,
      historyId:this.pendingUserApproval?.historyId!,
      managerId: this.pendingUserApproval?.approverManager!,
      productMappingId: this.pendingUserApproval?.productMappingId!,
      ApprovalTypeId: this.pendingUserApproval?.approvalTypeId!,
      uid: this.pendingUserApproval?.approverUID!,
      createdBy: this.persistance.getUserId()!

    }
    // this.access!.userId = this.users.id!;
    // this.access!.managerId = this.users.managerId!;
    // this.access!.productMappingId = this.pendingUserApproval?.productMappingId!;
    // this.access!.approvalType = this.pendingUserApproval?.approvalTypeId!
    // this.access!.uid = this.pendingUserApproval?.approverUID!;
    // this.access!.createdBy = 1;
  }

  submitReject() {
    this.bindData();
    this.apiService.submitReject(this.access!).subscribe((result: any) => {

      if (result) {
        this.notifier.notify("success", "Saved Successfully");
        this.reloadPage.emit("close");
      }
      else {
        this.notifier.notify("error", "Some Thing went wrong");
      }
    });
  }


  submitForward() {
    this.bindData();
    this.access!.managerId = this.managerid;
    this.access!.historyId = this.pendingUserApproval?.historyId!;
    this.apiService.submitForward(this.access!).subscribe((result: any) => {

      if (result) {
        this.notifier.notify("success", "Saved Successfully");
        this.reloadPage.emit("close");
      }
      else {
        this.notifier.notify("error", "Some Thing went wrong");
      }
    });
  }

  getManagerId() {
    this.managerid = this.persistance.getManagerId()!;
  }

  close() {
    (this.activeModal ?? this.modal)?.dismiss?.('dismissed');
  }

}
