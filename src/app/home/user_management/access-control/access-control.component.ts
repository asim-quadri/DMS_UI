import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  ModalDismissReasons,
  NgbDatepickerModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'angular-notifier';

import { UsersModel } from '../../../models/Users';
import { helperProducts } from '../../../enums/enums';
import { pendingApproval, accessModel } from '../../../models/pendingapproval';
import { Products } from '../../../models/products';
import { ApiService } from '../../../Services/api.service';
import { PersistenceService } from '../../../Services/persistence.service';

@Component({
  selector: 'app-access-control',
  templateUrl: './access-control.component.html',
  styleUrls: ['./access-control.component.scss'],
})
export class AccessControlComponent implements OnInit {
  active = 1;

  @Input()
  modal: any;

  @Input()
  user: UsersModel = {};

  @Input()
  pendingProductAccess: pendingApproval | undefined = {};

  @Output()
  reloadPage: EventEmitter<any> = new EventEmitter<any>();

  access: accessModel | undefined;
  products: Products[] = [];

  accessList: accessModel[] = [];

  isReveiw: boolean = false;

  formgroup: FormGroup = this.fb.group({
    roleScreen: [false],
    Userscreen: [false],
    accessControl: [false],
    uid: [''],
  });

  constructor(
    public apiService: ApiService,
    private fb: FormBuilder,
    private persistance: PersistenceService,
    private notifier: NotifierService
  ) {}

  ngOnInit(): void {
    this.isReveiw = false;
    this.getAccessList();
    this.getProducts();
  }

  getAccessList() {
    if (this.pendingProductAccess?.review) {
      this.isReveiw = true;
    }
    this.products = [];
    this.apiService
      .getAccessList(this.pendingProductAccess?.userUID!)
      .subscribe((result: accessModel[]) => {
        this.accessList = result;
        if (this.accessList.length > 0) {
          this.bindData();
        }
      });
  }

  bindData() {
    this.formgroup.patchValue({
      roleScreen: this.accessList.find(
        (f) => f.productName == helperProducts.roleScreen
      )?.enable,
      Userscreen: this.accessList.find(
        (f) => f.productName == helperProducts.userScreen
      )?.enable,
      accessControl: this.accessList.find(
        (f) => f.productName == helperProducts.accessControlScreen
      )?.enable,
    });
  }

  getProducts() {
    this.products = [];
    this.apiService.getAllUsers().subscribe((result: any) => {
      this.products = result;
    });
  }

  userMangeSubmit() {
    var access: accessModel[] = [];

    var mangageUserscreen: accessModel = {
      userId: this.user.id!,
      productId: 3,
      createdBy: this.persistance.getUserId()!,
      managerId: this.persistance.getManagerId()!,
      userUID: this.user.uid!
    }

    var reolescreen: accessModel = {
      userId: this.user.id!,
      productId: 4,
      createdBy: this.persistance.getUserId()!,
      managerId: this.persistance.getManagerId()!,
      userUID: this.user.uid!
    }
    var userscreen: accessModel = {
      userId: this.user.id!,
      productId: 5,
      createdBy: this.persistance.getUserId()!,
      managerId: this.persistance.getManagerId()!,
      userUID: this.user.uid!
    }

    var accesscreen: accessModel = {
      userId: this.user.id!,
      productId: 6,
      createdBy: this.persistance.getUserId()!,
      managerId: this.persistance.getManagerId()!,
      userUID: this.user.uid!
    }

    if (this.formgroup.controls['roleScreen'].value == true) {
      reolescreen.enable = 1;
    } else {
      reolescreen.enable = 0;
    }

    access.push(reolescreen);

    if (this.formgroup.controls['Userscreen'].value == true) {
      userscreen.enable = 1;
    } else {
      userscreen.enable = 0;
    }
    access.push(userscreen);

    if (this.formgroup.controls['accessControl'].value == true) {
      accesscreen.enable = 1;
    } else {
      accesscreen.enable = 0;
    }
    access.push(accesscreen);

    if (access.filter((f) => f.enable == 1).length > 0) {
      mangageUserscreen.enable = 1;
    } else {
      mangageUserscreen.enable = 0;
    }

    access.push(mangageUserscreen);

    this.apiService.postUserManagement(access).subscribe((result: any) => {
      if (result) {
        this.notifier.notify('success', 'Saved Successfully');
        this.reloadPage.emit('close');
      } else {
        this.notifier.notify('error', 'Some Thing went wrong');
      }
    });
  }

  next() {
    this.active++;
  }

  bindAccessData() {
    this.access = {
      userId: this.user?.id!,
      userUID:this.persistance!.getUserUID()!,
      managerId: this.pendingProductAccess?.approverManager!,
      productMappingId: this.pendingProductAccess?.productMappingId!,
      ApprovalTypeId: this.pendingProductAccess?.approvalTypeId!,
      uid: this.pendingProductAccess?.approverUID!,
      createdBy: this.persistance.getUserId()!,
    };
  }

  approve() {
    this.bindAccessData();
    this.apiService
      .submitProductApproved(this.access!)
      .subscribe((result: any) => {
        if (result) {
          this.notifier.notify('success', 'Updated Successfully');
          this.reloadPage.emit('close');
        } else {
          this.notifier.notify('error', 'Some Thing went wrong');
        }
      });
  }

  reject() {
    this.bindAccessData();
    this.apiService
      .submitProductReject(this.access!)
      .subscribe((result: any) => {
        if (result) {
          this.notifier.notify('success', 'Updated Successfully');
          this.reloadPage.emit('close');
        } else {
          this.notifier.notify('error', 'Some Thing went wrong');
        }
      });
  }
}
