import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Optional,
  Output,
  ViewChild,
} from '@angular/core';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { pendingApproval } from 'src/app/Models/pendingapproval';
import { ApiService } from 'src/app/Services/api.service';
import { ColDef, GridApi, ColumnApi } from 'ag-grid-community';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AccessControlComponent } from '../access-control/access-control.component';
import { ReviewUserComponent } from '../review-user/review-user.component';

const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
};

@Component({
  selector: 'app-user-approval',
  templateUrl: './user-approval.component.html',
  styleUrls: ['./user-approval.component.scss'],
})
export class UserApprovalComponent implements OnInit {
  public rowSelection: 'single' | 'multiple' = 'multiple';
  @ViewChild('agGrid') agGrid: any;
  defaultColumnDef = defaultColumnDef;
  private api: GridApi | undefined;
  @Input()
  modal: any;

  @Output()
  openUserReview: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  openUserAccessReview: EventEmitter<any> = new EventEmitter<any>();

  rowData: any[] = [];
  usersList: any[] = [];
  pendingApprovalModel: pendingApproval | undefined;

  columnDefs = [
    // {
    // 	field: 'RowSelect',
    // 	headerName: ' ',
    // 	checkboxSelection: true,
    // 	headerCheckboxSelection: true,
    // 	suppressMenu: true,
    // 	suppressSorting: true,
    // 	width: 100,
    // },
    { headerName: 'History', field: 'historyId', width: 150, hide: true },
    { headerName: 'Type', field: 'approvalType', flex: 1, minWidth: 150 },
    { headerName: 'Full Name', field: 'fullName', flex: 1, minWidth: 150 },
    { headerName: 'Employee Id', field: 'empId', flex: 1, minWidth: 150 },
    { headerName: 'Role', field: 'roleDisplayName', flex: 1, minWidth: 150 },
    { headerName: 'Point of Contact', field: 'pointofContact', flex: 1, minWidth: 150 },
    { headerName: 'Approved By', field: 'approvedBy', flex: 1, minWidth: 150 },
    {
      headerName: 'Status',
      field: 'dummystatus',
      flex: 1,
      minWidth: 110,
      cellRenderer: AgbuttonComponent,
      cellRendererParams: {
        clicked: (field: any) => {
          this.pendingApprovalModel = { ...field.data };
          if (
            field.data.approvalType == 'User' &&
            field.data.createdBy != this.persistance.getUserId() &&
            !this.persistance.isUser()
          ) {
            this.openUserReviewPopUp(this.pendingApprovalModel!);
          } else if (
            field.data.approvalType == 'Access' &&
            field.data.createdBy != this.persistance.getUserId() &&
            !this.persistance.isUser()
          ) {
            if (
              this.persistance.getUserId() !=
              this.pendingApprovalModel!.createdBy
            ) {
              this.openUserAccessReviewPopUp(this.pendingApprovalModel!);
            }
          }
        },
      },
    },
  ];

  constructor(
    public apiService: ApiService,
    private persistance: PersistenceService,
    private modalService: NgbModal,
    @Optional() public activeModal: NgbActiveModal
  ) {}

  close() {
    (this.activeModal ?? this.modal)?.dismiss?.('dismissed');
  }

  ngOnInit(): void {
    this.getAllUser();
    this.getAllUserPendingApproval();
  }

  //   openUserReviewPopUp(data: pendingApproval) {
  //   this.openUserReview.emit(data);
	// }
    getAllUser() {
    // const roleId = this.persistenceService.getRoleId();
    // console.log('Role ID:', roleId);
    this.apiService.getAllUsers().subscribe((result: any) => {
      result.forEach((element: any) => {
        element.dummystatus = element.status == 1 ? 'Active' : 'InActive';
        element.Control = 'control';
        element.Edit = 'edit';
      });
      this.usersList = result;
    });
  }

openUserReviewPopUp(data: pendingApproval) {
  const modalRef = this.modalService.open(ReviewUserComponent, {
    size: 'xl',
    centered: true,
  });
  modalRef.componentInstance.modal = this.modal;
  modalRef.componentInstance.usersList = this.usersList;
  modalRef.componentInstance.pendingUserApproval = data;
  modalRef.componentInstance.reloadPage.subscribe(() => {
    this.getAllUser();
    this.getAllUserPendingApproval();
  });
  modalRef.result.catch((reason: any) => {
    // Modal dismissed
    console.log('Modal dismissed:', reason);
  });
}


 openUserAccessReviewPopUp(data: pendingApproval) {
    this.openUserAccessReview.emit(data);
 }

  onGridReady(params: any): void {
    this.api = params.api;
  }

  onFilterTextBoxChanged(event: any) {
    this.api!.setQuickFilter(event.target.value);
  }

  getTabledata() {
    let selectedRows;
    selectedRows = this.agGrid.getSelectedRows();
    ///than you can map your selectedRows
    selectedRows.map((row: any) => {});
  }

  reload(event: any) {
    this.getAllUserPendingApproval();
    this.getAllUser();
  }


  getAllUserPendingApproval() {
    this.rowData = [];
    this.apiService
      .getAllUsersPendingApprovals(this.persistance.getUserUID()!)
      .subscribe((result: any) => {
        result.forEach((element: any) => {
          element.dummystatus = element.status;
          // element.Control = "control"
          // element.Edit = "edit";
        });
        this.rowData = result;
      });
  }
}
