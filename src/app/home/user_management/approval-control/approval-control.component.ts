import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
// import { ColDef, GridApi } from 'ag-grid-community';
import { AgbuttonComponent } from '../../../Components/ag-grid/agbutton/agbutton.component';
import { pendingApproval } from '../../../models/pendingapproval';
import { ApiService } from '../../../Services/api.service';
import { PersistenceService } from '../../../Services/persistence.service';
const defaultColumnDef = {
	editable: false,
	resizable: true,
	wrapText: true,
	autoHeight: true,
	sortable: true,
	angularCompileHeaders: true,
}
@Component({
	selector: 'app-approval-control',
	templateUrl: './approval-control.component.html',
	styleUrls: ['./approval-control.component.scss']
})
export class ApprovalControlComponent implements OnInit {
	public rowSelection: 'single' | 'multiple' = 'multiple';
	@ViewChild('agGrid') agGrid: any;
	defaultColumnDef = defaultColumnDef;
	// private api: GridApi | undefined;
	@Input()
	modal: any;

	@Output()
	openUserReview: EventEmitter<any> = new EventEmitter<any>()

	rowData: any[] = [];
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

		{ headerName: 'productMappingId', field: 'productMappingId', width: 150, },
		{ headerName: 'Type', field: 'approvalType', width: 150 },
		{ headerName: 'Full Name', field: 'fullName', width: 150 },
		{ headerName: 'Employee Id', field: 'empId', width: 150 },
		{ headerName: 'Role', field: 'roleDisplayName', width: 110 },
		{ headerName: 'Point of Contact', field: 'pointofContact', width: 150 },
		{ headerName: 'Approved By', field: 'approvedBy', width: 150 },
		{
			headerName: 'Status', field: 'dummystatus', width: 110,
			cellRenderer: AgbuttonComponent,
			cellRendererParams: {
				clicked: (field: any) => {
					if (this.persistance.getUserId() != this.pendingApprovalModel!.createdBy) {
						this.pendingApprovalModel = { ...field.data };
						this.openUserReviewPopUp(this.pendingApprovalModel!)
					}
				}
			},
		},

	];

	constructor(public apiService: ApiService, private persistance: PersistenceService) {

	}

	ngOnInit(): void {
		this.getAllUserPendingApproval();
	}

	openUserReviewPopUp(data: pendingApproval) {
		this.openUserReview.emit(data);
	}

	onGridReady(params: any): void {

		// this.api = params.api;
	}


	getTabledata() {
		let selectedRows;
		selectedRows = this.agGrid.getSelectedRows();
		///than you can map your selectedRows
		selectedRows.map((row: any) => {
		});
	}

	reload(event: any) {
		this.getAllUserPendingApproval();
	}

	getAllUserPendingApproval() {
		this.rowData = [];
		this.apiService.getAllUsersPendingApprovals('16193229-D8DC-4B89-8209-4E2FADE34930').subscribe((result: any) => {
			result.forEach((element: any) => {
				element.dummystatus = element.status
				// element.Control = "control"
				// element.Edit = "edit";
			});
			this.rowData = result;
		});
	}



}
