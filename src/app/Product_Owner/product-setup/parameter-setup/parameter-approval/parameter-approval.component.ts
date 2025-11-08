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
import { ParameterService } from 'src/app/Services/parameter.service';
import { NotifierService } from 'angular-notifier';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { publishFacade } from '@angular/compiler';
import { ReviewParameterComponent } from '../review-parameter/review-parameter.component';

const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
};

@Component({
  selector: 'app-parameter-approval',
  templateUrl: './parameter-approval.component.html',
  styleUrls: ['./parameter-approval.component.scss'],
})
export class ParameterApprovalComponent {
  public rowSelection: 'single' | 'multiple' = 'multiple';
  @ViewChild('agGrid') agGrid: any;
  defaultColumnDef = defaultColumnDef;
  private api: GridApi | undefined;

  @Input()
  modal: any;

  @Output()
  openParameterReview: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  openParameterAccessReview: EventEmitter<any> = new EventEmitter<any>();

  rowData: any[] = [];
  approvalList: any[] = [];
  pendingApprovalModel: pendingApproval | undefined;

  columnDefs = [
    { headerName: 'uid', field: 'uid', hide: true },
    {
      field: 'RowSelect',
      headerName: ' ',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      suppressMenu: true,
      suppressSorting: true,
      width: 50,
    },
    { headerName: 'History', field: 'historyId', flex: 1 },
    { headerName: 'Parameter Name', field: 'parameterName', flex: 1 },
    { headerName: 'Parameter Type', field: 'parameterType', flex: 1 },
    { headerName: 'Point of Contact', field: 'pointofContact', flex: 1 },
    { headerName: 'Approved By', field: 'approvedBy', flex: 1 },
    {
      headerName: 'Status',
      field: 'dummystatus',
      flex: 1,
      cellRenderer: AgbuttonComponent,
      cellRendererParams: {
        clicked: (field: any) => {
          this.pendingApprovalModel = { ...field.data };
          if (field.data.createdBy != this.persistance.getUserId()) {
            this.openParameterReviewPopUp(this.pendingApprovalModel!);
          } else if (field.data.approvalType == 'Access') {
            if (
              this.persistance.getUserId() !=
              this.pendingApprovalModel!.createdBy
            ) {
              this.openParameterAccessReviewPopUp(this.pendingApprovalModel!);
            }
          }
        },
      },
    },
  ];

  constructor(
    private modalService: NgbModal,
    private parameterservice: ParameterService,
    private notifier: NotifierService,
    private persistance: PersistenceService,
    @Optional() public activeModel: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.getAllParameterPendingApproval();
    this.getAllPendingApproval();
  }

    // openParameterReviewPopUp(data: pendingApproval) {
  	// 	this.openParameterReview.emit(data);
  	// }
openParameterReviewPopUp(data: pendingApproval) {
	const modalRef = this.modalService.open(ReviewParameterComponent, {
		size: 'xl',
		centered: true,
	});
	modalRef.componentInstance.modal = this.modal;
	modalRef.componentInstance.pendingParameterApproval = data;
	//modalRef.componentInstance.openParameterAccessReview =data;
	modalRef.componentInstance.reloadPage.subscribe((result: any) => {
		if(result=="close") {
			this.activeModel?.close();
		}
		this.getAllParameterPendingApproval();
		this.getAllPendingApproval();
	});
}

 openParameterAccessReviewPopUp(data: pendingApproval){
	const modalRef = this.modalService.open(ReviewParameterComponent, {
		size: 'xl',
		centered: true,
	});
	modalRef.componentInstance.modal = this.modal;
	//modalRef.componentInstance.openParameterReview = data;
	modalRef.componentInstance.pendingParameterApproval = data;
	modalRef.componentInstance.reloadPage.subscribe((result: any) => {
		this.getAllParameterPendingApproval();
		this.getAllPendingApproval();
	});
 }
//   openParameterAccessReviewPopUp(data: pendingApproval) {
//     this.openParameterAccessReview.emit(data);
//   }

  getTabledata() {
    let selectedRows;
    selectedRows = this.agGrid.getSelectedRows();
    ///than you can map your selectedRows
    selectedRows.map((row: any) => {});
  }

  reload(event: any) {
    this.getAllParameterPendingApproval();
    this.getAllPendingApproval();
  }

  getAllPendingApproval() {
    this.parameterservice.getAllPendingApprovals().subscribe((result: any) => {
      result.forEach((element: any) => {
        element.dummystatus = element.status;
        // element.Control = "control"
        // element.Edit = "edit";
      });
      this.approvalList = result;
    });
  }

  getAllParameterPendingApproval() {
    this.rowData = [];
    this.parameterservice
      .getAllParametersPendingApprovals(this.persistance.getUserUID()!)
      .subscribe((result: any) => {
        result.forEach((element: any) => {
          element.dummystatus = element.status;
          // element.Control = "control"
          // element.Edit = "edit";
        });
        this.rowData = result;
      });
  }

  closeParameterApproval() {
    (this.activeModel ?? this.modal)?.dismiss?.('dismissed');
  }
}
