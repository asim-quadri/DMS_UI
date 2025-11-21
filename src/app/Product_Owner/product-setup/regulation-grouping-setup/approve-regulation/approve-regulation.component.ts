import { Component, EventEmitter, Input, OnInit, Optional, Output } from '@angular/core';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationGroupService } from 'src/app/Services/regulation.service';
import { ColDef, GridApi, ColumnApi } from 'ag-grid-community';
import { accessModel } from 'src/app/Models/pendingapproval';
import { Observable } from 'rxjs';
import { NotifierService } from 'angular-notifier';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
const defaultColumnDef = {
	editable: false,
	resizable: true,
	wrapText: true,
	autoHeight: true,
	sortable: true,
	angularCompileHeaders: true,
}
@Component({
	selector: 'app-approve-regulation',
	templateUrl: './approve-regulation.component.html',
	styleUrls: ['./approve-regulation.component.scss']
})
export class ApproveRegulationComponent implements OnInit {
	public rowSelection: 'single' | 'multiple' = 'multiple';
	@Input() active: number = 1;
	@Input()
	modal: any;

	@Output()
	public reloaddata: EventEmitter<string> = new EventEmitter<string>();
	private gridApi: GridApi | undefined;
	defaultColumnDef = defaultColumnDef;
	regulationInsertionsApprovalCount: string = '.';
	approvalRegulationMappingCount: string = '.';
	rowData: any[] = [];
	approvalList: any[] = [];
	mappingList: any[] = [];
	columnDefs = [
		{ headerName: 'uid', field: 'uid', hide: true },
		{ headerName: 'countryId', field: 'countryId', hide: true },


		{
			field: 'RowSelect',
			headerName: ' ',
			checkboxSelection: true,
			headerCheckboxSelection: true,
			suppressMenu: true,
			suppressSorting: true,
			width: 50,
		},
		{ headerName: 'Regulation Group', field: 'regulationGroupName', flex: 1 },
		{ headerName: 'Regulation Code', field: 'regulationGroupCode', flex: 1 },
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

		// 			this.forwardSelectedRequest(field);

		// 		}
		// 	},
		// },

	];

	// Coutnry Regulation Mapping
	private mappingGridApi: GridApi | undefined;
	mappingRowData: any[] = [];
	mappingColumnDefs = [
		{ headerName: 'uid', field: 'uid', hide: true },
		{ headerName: 'countryId', field: 'countryId', hide: true },
		{ headerName: 'countryStateMappingId', field: 'countryStateMappingId', hide: true },
		{ headerName: 'countryRegulationGroupMappingId', field: 'countryRegulationGroupMappingId', hide: true },
		{
			field: 'RowSelect',
			headerName: ' ',
			checkboxSelection: true,
			headerCheckboxSelection: true,
			suppressMenu: true,
			suppressSorting: true,
			width: 50,
		},

		{ headerName: 'Country', field: 'countryName', flex: 1, },

		{ headerName: 'Regulation Group', field: 'regulationGroupName', flex: 1, },


		{ headerName: 'Point of Contact', field: 'fullName', flex: 1, },
		{ headerName: 'Approved By', field: 'approvedBy', flex: 1, },
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
	persistanceService: PersistenceService;


	// Coutnry Regulation Mapping End

	constructor(public regulationService: RegulationGroupService, private persistance: PersistenceService, private notifier: NotifierService, @Optional() public activeModel: NgbActiveModal) {
		this.persistanceService = this.persistance;
	}
	onGridReady(params: any): void {

		this.gridApi = params.api;
	}

	ngOnInit(): void {
		this.getMappingApprovalsList();
		this.getApprovalsList();

	}

	getAllApprovalsList() {
		this.regulationService.getAllRegulationGroupApprovalList().subscribe({
			next: (result: any) => {
				result.forEach((item: any) => {
					item.forward = 'Forward';
				});

				this.approvalList = result;
			},
			error: (error: any) => {
				console.log(error);
			}
		})
	}

	getApprovalsList() {
		var uid = this.persistance.getUserUID();
		this.regulationService.getRegulationGroupApprovalList(uid).subscribe({
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

	forwardSelectedRequest() {
		var sourece: Observable<any>[] = [];
		var selectedRows = this.gridApi?.getSelectedRows();
		selectedRows?.forEach((item) => {
			if (item.status == "Pending" && item.createdBy != this.persistance.getUserId()) {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,
					uid: item.uid
				};
				if (this.approvalList.find(x => x.regulationGroupName == item.regulationGroupName && x.status == "Approved")) {
					this.notifier.notify("error", "Already" + ' ' + item.regulationGroupName + ' ' + "Is Approved");
				}
				model.regulationGroupId = item.regulationGroupId;
				sourece.push(this.regulationService.submitRegulationGroupForward(model));


			}
		});
		if (sourece.length > 0) {
			this.regulationService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveRegulation();
	}


	acceptSelectedRequests() {
		var sourece: Observable<any>[] = [];
		var selectedRows = this.gridApi?.getSelectedRows();
		selectedRows?.forEach((item) => {
			if (item.status == "Pending" && item.createdBy != this.persistance.getUserId()) {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,
					uid: item.uid
				};
				if (this.approvalList.find(x => x.regulationGroupName == item.regulationGroupName && x.status == "Approved")) {
					this.notifier.notify("error", "Already" + ' ' + item.regulationGroupName + ' ' + "Is Approved");
				}
				model.regulationGroupId = item.regulationGroupId;
				sourece.push(this.regulationService.submitRegulationGroupApprove(model));


			}
		});
		if (sourece.length > 0) {
			this.regulationService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveRegulation();

	}

	rejectSelectedRequests() {
		var sourece: Observable<any>[] = [];
		var selectedRows = this.gridApi?.getSelectedRows();
		selectedRows?.forEach((item) => {
			if (item.status == "Pending" && item.createdBy != this.persistance.getUserId()) {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,

					uid: item.uid
				};

				model.regulationGroupId = item.regulationGroupId;
				sourece.push(this.regulationService.submitRegulationGroupReject(model));

			}
		});
		if (sourece.length > 0) {
			this.regulationService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveRegulation();

	}



	// Coutnry Regulation Mapping 

	onMappingGridReady(params: any): void {

		this.mappingGridApi = params.api;
	}

	getAllMappingApprovalsList() {
		this.regulationService.getAllCountryRegulationGroupMappingApproval().subscribe({
			next: (result: any) => {
				result.forEach((item: any) => {
					item.forward = 'Forward';
				});
				this.mappingList = result;
			},
			error: (error: any) => {
				console.log(error);
			}
		})
	}

	getMappingApprovalsList() {
		var uid = this.persistance.getUserUID();
		this.regulationService.getCountryRegulationGroupMappingApproval(uid).subscribe({
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

	forwardSelectedMappingRequest() {
		var sourece: Observable<any>[] = [];
		var selectedRows = this.mappingGridApi?.getSelectedRows();
		selectedRows?.forEach((item) => {

			if (item.status == "Pending" && item.createdBy != this.persistance.getUserId()) {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,
					uid: item.uid,
					countryRegulationGroupMappingId: item.countryRegulationGroupMappingId
				};
				if (this.mappingList.find(x => x.regulationGroupName == item.regulationGroupName && x.countryName == item.countryName && x.status == "Approved")) {
					this.notifier.notify("error", "Already" + ' ' + item.countryName + item.regulationGroupName + ' ' + "Is Approved");
				}
				sourece.push(this.regulationService.submitCountryRegulationGroupForward(model));
			}
		});
		if (sourece.length > 0) {
			this.regulationService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveRegulation();
	}

	acceptSelectedMappingRequests() {

		var sourece: Observable<any>[] = [];
		var selectedRows = this.mappingGridApi?.getSelectedRows();
		selectedRows?.forEach((item) => {

			if (item.status == "Pending" && item.createdBy != this.persistance.getUserId()) {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,
					uid: item.uid,
					countryRegulationGroupMappingId: item.countryRegulationGroupMappingId
				};
				if (this.mappingList.find(x => x.regulationGroupName == item.regulationGroupName && x.countryName == item.countryName && x.status == "Approved")) {
					this.notifier.notify("error", "Already" + ' ' + item.countryName + item.regulationGroupName + ' ' + "Is Approved");
				}
				sourece.push(this.regulationService.submitCountryRegulationGroupApprove(model));
			}
		});
		if (sourece.length > 0) {
			this.regulationService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveRegulation();
	}

	rejectSelectedMappingRequests() {
		var sourece: Observable<any>[] = [];
		var selectedRows = this.mappingGridApi?.getSelectedRows();
		selectedRows?.forEach((item) => {
			if (item.status == "Pending" && item.createdBy != this.persistance.getUserId()) {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,
					uid: item.uid,
					countryRegulationGroupMappingId: item.Id
				};

				sourece.push(this.regulationService.submitCountryRegulationGroupReject(model));
			}
		});
		if (sourece.length > 0) {
			this.regulationService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveRegulation();
	}


	onFilterCountryMappingChanged(event: any) {

		this.mappingGridApi!.setQuickFilter(event.target.value);
	}

	onFilterTextBoxChanged(event: any) {

		this.gridApi!.setQuickFilter(event.target.value);
	}


	// Coutnry Regulation Mapping End
	closeApproveRegulation() {
		(this.activeModel ?? this.modal)?.dismiss?.('dismissed');
	}


}
