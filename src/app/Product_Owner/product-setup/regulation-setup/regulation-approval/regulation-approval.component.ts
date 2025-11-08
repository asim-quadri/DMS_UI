import { publishFacade } from '@angular/compiler';
import { Component, EventEmitter, Input, OnInit, Optional, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid-community';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { ReviewRegulationSetupComponent } from '../review-regulation-setup/review-regulation-setup.component';
import { ReviewComplianceComponent } from '../review-compliance/review-compliance.component';
const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
}
@Component({
  selector: 'app-regulation-approval',
  templateUrl: './regulation-approval.component.html',
  styleUrls: ['./regulation-approval.component.scss']
})
export class RegulationApprovalComponent implements OnInit {
  public rowSelection: 'single' | 'multiple' = 'multiple';
  active = 1;
  currentUserId = 0;

  @Input()
  modal: any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public sendSelectedUID: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  openRegulationSetupReview: EventEmitter<any> = new EventEmitter<any>()

  private gridApi: GridApi | undefined;
  defaultColumnDef = defaultColumnDef;
  persistanceService: PersistenceService | undefined;
  rowData: any[] = [];
  columnDefs = [
    { headerName: 'uid', field: 'approverUID', hide: true },
    { headerName: 'createdBy', field: 'createdBy', hide: true },
    {
      field: 'RowSelect',
      headerName: ' ',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      suppressMenu: true,
      suppressSorting: true,
      width: 50,
    },
    { headerName: 'Type', field: 'regulationType', flex: 1 },
    { headerName: 'Name', field: 'displayName', flex: 1 },
    { headerName: 'Id', field: 'Id', flex: 1 },
    { headerName: 'ParentName', field: 'parentName', flex: 1 },
    { headerName: 'Point of Contact', field: 'fullName', flex: 1 },
    { headerName: 'Approved By', field: 'approvedBy', flex: 1 },
    {
      headerName: 'Status', field: 'status', flex: 1,
      cellRenderer: AgbuttonComponent,
      cellRendererParams: {
        clicked: (field: any) => {
          if (this.persistance.getUserId() != field.data!.createdBy) {
          this.sendSelectedUID.emit(field.data)
            this.onOpenRegulationSetupReview(field.data);
          }
        }
      },
    },

  ];




  // Coutnry State Mapping End

  constructor(private persistance: PersistenceService, private regulation:RegulationSetupService,@Optional() public activeModal: NgbActiveModal,private modalService: NgbModal) {
    this.persistanceService = this.persistance;
  }


  onGridReady(params: any): void {

    this.gridApi = params.api;
  }

  ngOnInit(): void {
    this.currentUserId = this.persistance.getUserId()!;
    this.getApprovalsList();

  }

  getApprovalsList() {
    var uid = this.persistance.getUserUID();
    this.regulation.GetPendingRegSetupApproval(uid).subscribe({
    	next: (result: any) => {
    		// result.forEach((item: any) => {
    		// 	item.forward = 'Forward';
    		// 	item.Edit = 'edit';
    		// });
    		this.rowData = result;
    	},
    	error: (error: any) => {
    		console.log(error);
    	}
    })
  }


  onFilterTextBoxChanged(event: any) {

    this.gridApi!.setQuickFilter(event.target.value);
  }

onOpenRegulationSetupReview(data: any): void {

  if(data.regulationType && data.regulationType.toLowerCase() === 'regulation setup')
  {
  const regModelRef = this.modalService.open(ReviewRegulationSetupComponent, { size: 'xl', centered: true });

  regModelRef.componentInstance.approverUID = data.approverUID;
  regModelRef.componentInstance.openRegulationSetupReview = this.openRegulationSetupReview;
  regModelRef.result.finally(() => {
    this.getApprovalsList();
  });
}
else if(data.regulationType && data.regulationType.toLowerCase() === 'regulation compliance')
{
  const regModelRef = this.modalService.open(ReviewComplianceComponent, { size: 'xl', centered: true });
    regModelRef.componentInstance.approverUID = data.approverUID;
 regModelRef.result.finally(() => {
    this.getApprovalsList();
  });
}
}

  // acceptSelectedMappingRequests() {

	// 	var sourece: Observable<any>[] = [];
	// 	var selectedRows = this.mappingGridApi?.getSelectedRows();
	// 	selectedRows?.forEach((item) => {

	// 		if (item.status == "Pending"  && item.createdBy != this.persistance.getUserId())  {
	// 			var model: accessModel = {
	// 				managerId: this.persistance.getManagerId(),
	// 				createdBy: this.persistance.getUserId()!,
	// 				uid: item.uid,
	// 				countryRegulationGroupMappingId: item.countryRegulationGroupMappingId
	// 			};

	// 			sourece.push(this.regulation.submitCountryRegulationGroupApprove(model));
	// 		}
	// 	});
	// 	if (sourece.length > 0) {
	// 		this.regulation.multipleAPIRequests(sourece).subscribe((result) => {

	// 			console.log(result);
	// 			this.reloaddata.emit();
	// 		})
	// 	}
	// }

	// rejectSelectedMappingRequests() {
	// 	var sourece: Observable<any>[] = [];
	// 	var selectedRows = this.mappingGridApi?.getSelectedRows();
	// 	selectedRows?.forEach((item) => {
	// 		if (item.status == "Pending"  && item.createdBy != this.persistance.getUserId()) {
	// 			var model: accessModel = {
	// 				managerId: this.persistance.getManagerId(),
	// 				createdBy: this.persistance.getUserId()!,
	// 				uid: item.uid,
	// 				countryRegulationGroupMappingId: item.Id
	// 			};

	// 			sourece.push(this.regulation.submitCountryRegulationGroupReject(model));
	// 		}
	// 	});
	// 	if (sourece.length > 0) {
	// 		this.regulation.multipleAPIRequests(sourece).subscribe((result) => {

	// 			console.log(result);
	// 			this.reloaddata.emit();
	// 		})
	// 	}
	// }

  
closeRegulationSetUpApproval() {
  (this.activeModal ?? this.modal)?.dismiss?.('dismissed');
}

}
