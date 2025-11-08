import { Component, EventEmitter, Input, Optional, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid-community';
import { th } from 'date-fns/locale';
import { Observable } from 'rxjs';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { BranchList, BranchModel } from 'src/app/Models/branchModel';
import { accessModel, pendingApproval } from 'src/app/Models/pendingapproval';
import { BranchService } from 'src/app/Services/branch.service';
import { PersistenceService } from 'src/app/Services/persistence.service';

const defaultColumnDef = {
	editable: false,
	resizable: true,
	wrapText: true,
	autoHeight: true,
	sortable: true,
	angularCompileHeaders: true,
}

@Component({
	selector: 'app-approval-branch-setup',
	templateUrl: './approval-branch-setup.component.html',
	styleUrls: ['./approval-branch-setup.component.scss']
})
export class ApprovalBranchSetupComponent {
	public rowSelection: 'single' | 'multiple' = 'multiple';

	@Input() active: number = 1;
	currentUserId = 0;
	roleName = "";
	pendingParameterApproval: pendingApproval | undefined;
	branches: BranchList = {};
	@Input()
	modal: any;

	@Output()
	public reloaddata: EventEmitter<string> = new EventEmitter<string>();
	private gridApi: GridApi | undefined;
	defaultColumnDef = defaultColumnDef;
	persistanceService: PersistenceService | undefined;
	insertionBranchApprovalCount: string = '.';
	approvalBranchMappingCount: string = '.';
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
		{ headerName: 'TOB Name', field: 'displayName', flex: 1 },
		{ headerName: 'Point of Contact', field: 'fullName', flex: 1 },
		{ headerName: 'Approved By', field: 'approvedBy', flex: 1 },
		{
			headerName: 'Status', field: 'status', flex: 1,
			cellRenderer: AgbuttonComponent,
			cellRendererParams: {
				clicked: (field: any) => {
				}
			},
		},
	];
	private mappingGridApi: GridApi | undefined;
	mappingRowData: any[] = [];
	mappingColumnDefs = [
		{ headerName: 'uid', field: 'uid', hide: true },
		{ headerName: 'TOBMappingId', field: 'tobMappingId', hide: true },
		{
			field: 'RowSelect',
			headerName: ' ',
			checkboxSelection: true,
			headerCheckboxSelection: true,
			suppressMenu: true,
			suppressSorting: true,
			width: 50,
		},
		{ headerName: 'Type Of Branch', field: 'tobName', flex: 1 },

		{ headerName: 'Country', field: 'countryName', flex: 1 },

		{ headerName: 'Major Industry', field: 'majorIndustryName', flex: 1 },

		{ headerName: 'Minor Industry', field: 'minorIndustryName', flex: 1 },


		{ headerName: 'Point of Contact', field: 'fullName', flex: 1 },
		{ headerName: 'Approved By', field: 'approvedBy', flex: 1 },
		{
			headerName: 'Status', field: 'status', flex: 1,
			cellRenderer: AgbuttonComponent,
			cellRendererParams: {
				clicked: (field: any) => {



				}
			},
		},
		// {
		// 	headerName: 'Forward', field: 'forward', width: 110,
		// 	cellRenderer: AgbuttonComponent,
		// 	cellRendererParams: {
		// 		clicked: (field: any) => {

		// 			this.forwardSelectedMappingRequest(field);

		// 		}
		// 	},
		// },

	];
	constructor(private persistance: PersistenceService, private branchService: BranchService, @Optional() public activeModal: NgbActiveModal) {
		this.persistanceService = this.persistance;
	}

	ngOnInit(): void {
		this.currentUserId = this.persistance.getUserId()!;
		this.roleName = this.persistance.getRole()!;
		this.getApprovalsList();
		this.getTOBMappingApprovalsList();
	}

	onGridReady(params: any): void {
		this.gridApi = params.api;
	}

	acceptSelectedRequests() {
		var sourece: Observable<any>[] = [];
		var selectedRows = this.gridApi?.getSelectedRows();
		selectedRows?.forEach((item) => {
			if (item.status == "Pending") {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,
					uid: item.approverUID
				};
				if (item.status == "Pending" && item.createdBy != this.currentUserId) {
					model.TOBId = item.TOBId;
					sourece.push(this.branchService.submitTOBApproved(model));
				}
			}
		});
		if (sourece.length > 0) {
			this.branchService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}

		this.getApprovalsList();
	}

	rejectSelectedRequests() {
		var sourece: Observable<any>[] = [];
		var selectedRows = this.gridApi?.getSelectedRows();
		selectedRows?.forEach((item) => {
			if (item.status == "Pending") {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,
					uid: item.uid
				};
				if (item.type == "Add TOB") {
					model.TOBId = item.TOBId;
					sourece.push(this.branchService.submitTOBReject(model));
				}
			}
		});
		if (sourece.length > 0) {
			this.branchService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})

		}

		this.getApprovalsList();

	}

	onFilterTextBoxChanged(event: any) {
		this.gridApi!.setQuickFilter(event.target.value);
	}

	getApprovalsList() {
		var uid = this.persistance.getUserUID();
		this.branchService.GetPendingTOBApproval(uid).subscribe({
			next: (result: any) => {
				result.forEach((item: any) => {
					item.forward = 'Forward';
				});
				this.rowData = result;
			},
			error: (error: any) => {
				console.log(error);
			}
		})
	}


	onMappingGridReady(params: any): void {
		this.mappingGridApi = params.api;
	}

	getTOBMappingApprovalsList() {
		var uid = this.persistance.getUserUID();
		this.branchService.GetTOBMappingApproval(uid).subscribe({
			next: (result: any) => {
				result.forEach((item: any) => {
					item.forward = 'Forward';
				});
				this.mappingRowData = result;
			},
			error: (error: any) => {
				console.log(error);
			}
		})
	}

	acceptSelectedMappingRequests() {

		var sourece: Observable<any>[] = [];
		var selectedRows = this.mappingGridApi?.getSelectedRows();
		selectedRows?.filter(f => f.createdBy != this.currentUserId && f.status == "Pending").forEach((item) => {
			if (item.status == "Pending") {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.currentUserId,
					uid: item.uid,
					TOBMappingId: item.TOBMappingId,
					id: item.id
				};

				sourece.push(this.branchService.submitTOBMappingApproved(model));

			}
		});
		if (sourece.length > 0) {
			this.branchService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}

		this.getTOBMappingApprovalsList();
		this.close();
	}

	rejectSelectedMappingRequests() {
		var sourece: Observable<any>[] = [];
		var selectedRows = this.mappingGridApi?.getSelectedRows();
		selectedRows?.filter(f => f.createdBy != this.currentUserId && f.status == "Pending").forEach((item) => {
			if (item.status == "Pending") {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,
					uid: item.uid,
					TOBMappingId: item.Id
				};

				sourece.push(this.branchService.submitTOBMappingReject(model));

			}
		});
		if (sourece.length > 0) {
			this.branchService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}

		this.getTOBMappingApprovalsList();
		this.close();
	}
	close() {
		(this.activeModal ?? this.modal)?.dismiss?.('dismissed');
	}
}
