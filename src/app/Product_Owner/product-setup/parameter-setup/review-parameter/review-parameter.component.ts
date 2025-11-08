import { Component, EventEmitter, Input, OnInit, Optional, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RxwebValidators, disable } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { Observable } from 'rxjs';
import { ParameterList, ParameterModel } from 'src/app/Models/parameter';
import { pendingApproval, accessModel } from 'src/app/Models/pendingapproval';
import { RolesModels } from 'src/app/Models/roles';
import { ApiService } from 'src/app/Services/api.service';
import { ParameterService } from 'src/app/Services/parameter.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { fromToDate } from 'src/app/Validators/dateReange';
import { UserRole } from 'src/app/enums/enums';

@Component({
  selector: 'app-review-parameter',
  templateUrl: './review-parameter.component.html',
  styleUrls: ['./review-parameter.component.scss']
})
export class ReviewParameterComponent implements OnInit {
  managerid: number = 0;
  roleName = "";
  constructor(private modalService: NgbModal, private fb: FormBuilder,
    public parameterService: ParameterService, public apiService: ApiService, private notifier: NotifierService, private persistance: PersistenceService, @Optional() public activeModel: NgbActiveModal) {
    this.getAllRoles();
  }

  @Input()
  modal: any;

  @Input()
  parametersList: ParameterModel[] = [];
  enable: boolean = false;

  parameters: ParameterList = {};

  rolesData: RolesModels[] = [];
  @Input()
  pendingParameterApproval: pendingApproval | undefined;

  @Output()
  reloadPage: EventEmitter<any> = new EventEmitter<any>();

  access: accessModel | undefined;

  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [''],
    parameterName: [{ value: '', disabled: true }, [
      RxwebValidators.required({ message: 'Parameter name is required' })
    ]],
    empId: [{ value: '', disabled: true }, RxwebValidators.required({ message: 'Employee id is required' }),],
    parameterType: [{ value: '', disabled: true }, [
      RxwebValidators.required({ message: 'Parameter type is required' })
    ]],
    // managerId: [{ value: '', disabled: true }, RxwebValidators.required({ message: 'Select the Manger' })]
  },
  );

  ngOnInit(): void {
    this.getManagerId();
    this.getParameterByUID();
    this.roleName = this.persistance.getRole()!;
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
      var parameter: ParameterModel = { ... this.formgroup.value };
      if (parameter.id == 0 || parameter.id == null) {
        parameter.id = 0;
        parameter.uid = null;

      }
      parameter.createdBy = this.persistance.getUserId()!;
      parameter.approvalManagerId = this.persistance.getManagerId();

      this.parameterService.addParameter(parameter, this.pendingParameterApproval?.approverUID!).subscribe((result: ParameterModel) => {
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
    }
  }

  getAllRoles() {
    this.apiService.getAllRoles().subscribe((result: any) => {
      this.rolesData = result.filter((f: any) => f.roleName != UserRole.SuperAdmin && f.roleName != UserRole.ITSupportAdmin);
    });
  }

  getParameterByUID() {
    this.parameterService.getHistoryParameterByID(this.pendingParameterApproval?.historyId).subscribe((result: ParameterModel) => {
      this.parameters = result;
      this.formgroup.patchValue({
        uid: result.uid,
        id: result.id,
        parameterName: result.parameterName,
        parameterType: result.parameterType,
        roleId: result.roleId,
        managerId: result.managerId
      });
    });
  }

  submitApproved() {
    this.bindData();
    if (this.persistance.getRole() == UserRole.Reviewer) {
      this.parameterService.submitReviewed(this.access!).subscribe((result: any) => {
        if (result) {
          this.notifier.notify("success", "Saved Successfully");
          this.closeParameterReview();
          this.reloadPage.emit("close");
        }
        else {
          this.notifier.notify("error", "Some Thing went wrong");
        }

      });
    }
    else {
      this.parameterService.submitApproved(this.access!).subscribe((result: any) => {
        if (result) {
          this.notifier.notify("success", "Saved Successfully");
          this.closeParameterReview();
          this.reloadPage.emit("close");
        }
        else {
          this.notifier.notify("error", "Some Thing went wrong");
        }

      });
    }
    this.closeParameterReview();
  }


  bindData() {
    this.access = {
      userId: this.parameters.id!,
      historyId: this.pendingParameterApproval?.historyId!,
      managerId: this.pendingParameterApproval?.approverManager!,
      productMappingId: this.pendingParameterApproval?.productMappingId!,
      ApprovalTypeId: this.pendingParameterApproval?.approvalTypeId!,
      uid: this.pendingParameterApproval?.approverUID!,
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
    this.parameterService.submitReject(this.access!).subscribe((result: any) => {

      if (result) {
        this.notifier.notify("success", "Saved Successfully");
        this.closeParameterReview();
        this.reloadPage.emit("close");
      }
      else {
        this.notifier.notify("error", "Some Thing went wrong");
      }
    });
    this.closeParameterReview();

  }

  getManagerId() {
    this.managerid = this.persistance.getManagerId()!;
  }

  closeParameterReview() {
    (this.activeModel ?? this.modal)?.dismiss?.('dismissed');
  }
}
