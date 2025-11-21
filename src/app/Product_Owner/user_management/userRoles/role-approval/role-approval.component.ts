import { Component, EventEmitter, Input, OnInit, Optional, Output, ViewChild } from '@angular/core';
import { AgbuttonComponent } from '../../../../Components/ag-grid/agbutton/agbutton.component';
import { pendingApproval } from '../../../../Models/pendingapproval';
import { ApiService } from '../../../../Services/api.service';
import { ColDef, GridApi, ColumnApi } from 'ag-grid-community';
import { PersistenceService } from '../../../../Services/persistence.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgModel } from '@angular/forms';
import { ReviewRoleComponent } from '../review-role/review-role.component';

const defaultColumnDef = {
	editable: false,
	resizable: true,
	wrapText: true,
	autoHeight: true,
	sortable: true,
	angularCompileHeaders: true,
}

@Component({
	selector: 'app-role-approval',
	templateUrl: './role-approval.component.html',
	styleUrls: ['./role-approval.component.scss']
})
export class RoleApprovalComponent {
	public rowSelection: 'single' | 'multiple' = 'multiple';
	@ViewChild('agGrid') agGrid: any;
	defaultColumnDef = defaultColumnDef;
	private api: GridApi | undefined;
	@Input()
	modal: any;

	@Output()
	openRoleReview: EventEmitter<any> = new EventEmitter<any>()

	@Output()
	openUserAccessReview: EventEmitter<any> = new EventEmitter<any>()

	rowData: any[] = [];
	pendingApprovalModel: pendingApproval | undefined;

	columnDefs = [
		{
			field: 'RowSelect',
			headerName: ' ',
			checkboxSelection: true,
			headerCheckboxSelection: true,
			suppressMenu: true,
			suppressSorting: true,
			width: 100,
		},
		{ headerName: 'historyId', field: 'historyId', width: 150, hide: true },
		{ headerName: 'Type', field: 'approvalType', width: 150 },
		// { headerName: 'Full Name', field: 'fullName', width: 150 },
		// { headerName: 'Employee Id', field: 'empId', width: 150 },
		{ headerName: 'Role Name', field: 'roleName', width: 150 },
		{ headerName: 'Role Display Name', field: 'roleDisplayName', width: 200 },
		{ headerName: 'Point of Contact', field: 'pointofContact', width: 150 },
		{ headerName: 'Approved By', field: 'approvedBy', width: 150 },
		{
			headerName: 'Status', field: 'dummystatus', width: 110,
			cellRenderer: AgbuttonComponent,
			cellRendererParams: {
				clicked: (field: any) => {
					this.pendingApprovalModel = { ...field.data };
					if (field.data.approvalType == 'Role' && field.data.createdBy != this.persistance.getUserId()) {
						this.openRoleReviewPopUp(this.pendingApprovalModel!)
					}
					else if (field.data.approvalType == 'Access') {
						if (this.persistance.getUserId() != this.pendingApprovalModel!.createdBy) {
							this.openRoleAccessReviewPopUp(this.pendingApprovalModel!)
						}
					}
				}
			},
		},
	];

	constructor(public apiService: ApiService,  private modalService: NgbModal, private persistance: PersistenceService,@Optional() public activeModal: NgbActiveModal) {
		this.getAllRolePendingApproval();

	}

	ngOnInit(): void {
		this.getAllRolePendingApproval();
	}

	openRoleReviewPopUp(data: pendingApproval) {
		// this.openRoleReview.emit(data);
	var roleModelRef=	this.modalService.open(ReviewRoleComponent, { size: 'xl', centered: true });
		roleModelRef.componentInstance.pendingRoleApproval = data;
		roleModelRef.componentInstance.reloadPage.subscribe((event: any) => {
			this.getAllRolePendingApproval();
		}
		);
		roleModelRef.componentInstance.closeResult = 'Cross click';
		roleModelRef.componentInstance.modal = this.modal;
		roleModelRef.componentInstance.activeModal = this.activeModal;

		//this.openRoleReview.emit(data);
	}

	openRoleAccessReviewPopUp(data: pendingApproval) {
		this.openUserAccessReview.emit(data);
	}

	onGridReady(params: any): void {

		this.api = params.api;
	}


	getTabledata() {
		let selectedRows;
		selectedRows = this.agGrid.getSelectedRows();
		console.log(selectedRows);
		///than you can map your selectedRows 
		selectedRows.map((row: any) => {
			console.log(row);
			console.log(row.data);
		});
	}

	reload(event: any) {
		this.getAllRolePendingApproval();
	}

	getAllRolePendingApproval() {
		this.rowData = [];
		this.apiService.getAllRolesPendingApprovals(this.persistance.getUserUID()!).subscribe((result: any) => {
			result.forEach((element: any) => {
				element.dummystatus = element.status
				// element.Control = "control"
				// element.Edit = "edit";
			});
			this.rowData = result;
		});
	}
	onFilterTextBoxChanged(event: any) {

		this.api!.setQuickFilter(event.target.value);
	}

	close() {
		(this.activeModal ?? this.modal)?.dismiss?.('dismissed');
	}
}
