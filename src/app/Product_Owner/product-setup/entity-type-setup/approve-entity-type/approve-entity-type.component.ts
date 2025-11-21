import { Component, EventEmitter, Input, OnInit, Optional, Output } from '@angular/core';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { ColDef, GridApi, ColumnApi } from 'ag-grid-community';
import { accessModel } from 'src/app/Models/pendingapproval';
import { Observable } from 'rxjs';
import { EntityTypeService } from 'src/app/Services/entityType.service';
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
	selector: 'app-approve-entity-type',
	templateUrl: './approve-entity-type.component.html',
	styleUrls: ['./approve-entity-type.component.scss']
})
export class ApproveEntityTypeComponent implements OnInit {
	public rowSelection: 'single' | 'multiple' = 'multiple';
	active = 1;
	@Input()
	modal: any;

	@Output()
	public reloaddata: EventEmitter<string> = new EventEmitter<string>();
	insertionEntityTypeApprovalCount: string = '.';
	approvalEntityTypeMappingCount: string = '.';
	private gridApi: GridApi | undefined;
	defaultColumnDef = defaultColumnDef;
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
		{ headerName: 'Entity Type', field: 'entityType', flex: 1 },
		{ headerName: 'Entity Type Code', field: 'entityTypeCode', flex: 1 },
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

	// Coutnry EntityType Mapping
	private mappingGridApi: GridApi | undefined;
	mappingRowData: any[] = [];
	mappingColumnDefs = [
		{ headerName: 'uid', field: 'uid', hide: true },
		{ headerName: 'countryId', field: 'countryId', hide: true },
		{ headerName: 'countryEntityTypeMappingId', field: 'countryEntityTypeMappingId', hide: true },
		{
			field: 'RowSelect',
			headerName: ' ',
			checkboxSelection: true,
			headerCheckboxSelection: true,
			suppressMenu: true,
			suppressSorting: true,
			width: 50,
		},

		{ headerName: 'Country', field: 'countryName', flex: 1 },

		{ headerName: 'Entity Type', field: 'entityType', flex: 1 },


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
	persistanceService: PersistenceService;


	// Coutnry EntityType Mapping End

	constructor(public entityTypeService: EntityTypeService, private persistance: PersistenceService, private notifier: NotifierService, @Optional() public activeModal: NgbActiveModal) {
		this.persistanceService = this.persistance;
	}
	onGridReady(params: any): void {

		this.gridApi = params.api;
	}

	ngOnInit(): void {
		this.getMappingApprovalsList();
		this.getApprovalsList();
		this.getAllMappingApprovalsList();
		this.getAllApprovalsList();
	}
	getApprovalsList() {
		var uid = this.persistance.getUserUID();
		this.entityTypeService.getEntityTypeApprovalList(uid).subscribe({
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

	getAllApprovalsList() {
		this.entityTypeService.getAllEntityTypeApprovalList().subscribe({
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
				if (this.approvalList.find(x => x.entityType == item.entityType && x.status == "Approved")) {
					this.notifier.notify("error", "Already" + ' ' + item.entityType + ' ' + "Is Approved");
				}
				model.entityTypeId = item.entityTypeId;
				sourece.push(this.entityTypeService.submitEntityTypeForward(model));


			}
		});
		if (sourece.length > 0) {
			this.entityTypeService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveEntityType();

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
				if (this.approvalList.find(x => x.entityType == item.entityType && x.status == "Approved")) {
					this.notifier.notify("error", "Already" + ' ' + item.entityType + ' ' + "Is Approved");
				}
				model.entityTypeId = item.entityTypeId;
				sourece.push(this.entityTypeService.submitEntityTypeApprove(model));


			}
		});
		if (sourece.length > 0) {
			this.entityTypeService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveEntityType();

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

				model.entityTypeId = item.entityTypeId;
				sourece.push(this.entityTypeService.submitEntityTypeReject(model));

			}
		});
		if (sourece.length > 0) {
			this.entityTypeService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveEntityType();

	}



	// Coutnry EntityType Mapping 

	onMappingGridReady(params: any): void {

		this.mappingGridApi = params.api;
	}

	getMappingApprovalsList() {
		var uid = this.persistance.getUserUID();
		this.entityTypeService.getCountryEntityTypeMappingApproval(uid).subscribe({
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

	getAllMappingApprovalsList() {
		this.entityTypeService.getAllCountryEntityTypeMappingApproval().subscribe({
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

	forwardSelectedMappingRequest() {
		var sourece: Observable<any>[] = [];
		var selectedRows = this.mappingGridApi?.getSelectedRows();
		selectedRows?.forEach((item) => {

			if (item.status == "Pending" && item.createdBy != this.persistance.getUserId()) {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,
					uid: item.uid,
					countryEntityTypeMappingId: item.countryEntityTypeMappingId
				};
				if (this.mappingList.find(x => x.entityType == item.entityType && x.countryName == item.countryName && x.status == "Approved")) {
					this.notifier.notify("error", "Already" + ' ' + item.countryName + item.entityType + ' ' + "Is Approved");
				}
				sourece.push(this.entityTypeService.submitCountryEntityTypeForward(model));
			}
		});
		if (sourece.length > 0) {
			this.entityTypeService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveEntityType();
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
					countryEntityTypeMappingId: item.countryEntityTypeMappingId
				};
				if (this.mappingList.find(x => x.entityType == item.entityType && x.countryName == item.countryName && x.status == "Approved")) {
					this.notifier.notify("error", "Already" + ' ' + item.countryName + item.entityType + ' ' + "Is Approved");
				}
				sourece.push(this.entityTypeService.submitCountryEntityTypeApprove(model));
			}
		});
		if (sourece.length > 0) {
			this.entityTypeService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveEntityType();
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
					countryEntityTypeMappingId: item.Id
				};

				sourece.push(this.entityTypeService.submitCountryEntityTypeReject(model));
			}
		});
		if (sourece.length > 0) {
			this.entityTypeService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveEntityType();
	}


	onFilterCountryMappingChanged(event: any) {

		this.mappingGridApi!.setQuickFilter(event.target.value);
	}

	onFilterTextBoxChanged(event: any) {

		this.gridApi!.setQuickFilter(event.target.value);
	}


	// Coutnry EntityType Mapping End

	closeApproveEntityType() {
		(this.activeModal ?? this.modal)?.dismiss?.('dismissed');
		this.reloaddata.emit();
	}
}
