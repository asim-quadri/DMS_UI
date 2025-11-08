import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ColDef, GridApi, ColumnApi } from 'ag-grid-community';
import { AgbuttonComponent } from '../../../../Components/ag-grid/agbutton/agbutton.component';
import { IndustryService } from '../../../../Services/industry.service';
import { PersistenceService } from '../../../../Services/persistence.service';
import { Observable } from 'rxjs';
import { accessModel } from '../../../../Models/pendingapproval';

const defaultColumnDef = {
	editable: false,
	resizable: true,
	wrapText: true,
	autoHeight: true,
	sortable: true,
	angularCompileHeaders: true,
}

@Component({
  selector: 'app-approval-majorminor-industry',
  templateUrl: './approval-majorminor-industry.component.html',
  styleUrls: ['./approval-majorminor-industry.component.scss']
})
export class ApprovalMajorminorIndustryComponent {
  public rowSelection: 'single' | 'multiple' = 'multiple';
	active = 1;
	currentUserId = 0;
	@Input()
	modal: any;

  @Output()
	public reloaddata: EventEmitter<string> = new EventEmitter<string>();
	private gridApi: GridApi | undefined;
	defaultColumnDef = defaultColumnDef;
	rowData: any[] = [];
  columnDefs = [
		{ headerName: 'uid', field: 'uid', hide: true },
		{ headerName: 'countryId', field: 'countryId', hide: true },
		{ headerName: 'majorIndustryId', field: 'majorIndustryId', hide: true },
		{
			field: 'RowSelect',
			headerName: ' ',
			checkboxSelection: true,
			headerCheckboxSelection: true,
			suppressMenu: true,
			suppressSorting: true,
			width: 100,
		},
		{ headerName: 'Type', field: 'type', width: 120 },
		{ headerName: 'MajorIndustry Name', field: 'majorIndustryName', width: 120 },
		{ headerName: 'MajorIndustry Code', field: 'majorIndustryCode', width: 100 },
		{ headerName: 'MinorIndustry Name', field: 'minorIndustryName', width: 150 },
		{ headerName: 'MinorIndustry Code', field: 'minorIndustryCode', width: 110 },
		{ headerName: 'Point of Contact', field: 'fullName', width: 150 },
		{
			headerName: 'Status', field: 'status', width: 110,
			cellRenderer: AgbuttonComponent,
			cellRendererParams: {
				clicked: (field: any) => {
				}
			},
		},

		{
			headerName: 'Forward', field: 'forward', width: 110,
			cellRenderer: AgbuttonComponent,
			cellRendererParams: {
				clicked: (field: any) => {

					this.forwardSelectedRequest(field);

				}
			},
		},
	];
  // Major Minor Industry Mapping
	private mappingGridApi: GridApi | undefined;
	mappingRowData: any[] = [];
	mappingColumnDefs = [
		{ headerName: 'uid', field: 'uid', hide: true },
		{ headerName: 'MajorMinorIndustryMappingId', field: 'MajorMinorIndustryMappingId', hide: true },
		{
			field: 'RowSelect',
			headerName: ' ',
			checkboxSelection: true,
			headerCheckboxSelection: true,
			suppressMenu: true,
			suppressSorting: true,
			width: 100,
		},
		
		{ headerName: 'Major Industry', field: 'majorIndustryName', width: 120 },

		{ headerName: 'Minor Industry', field: 'minorIndustryName', width: 150 },


		{ headerName: 'Point of Contact', field: 'fullName', width: 150 },
		{
			headerName: 'Status', field: 'status', width: 110,
			cellRenderer: AgbuttonComponent,
			cellRendererParams: {
				clicked: (field: any) => {



				}
			},
		},

		{
			headerName: 'Forward', field: 'forward', width: 110,
			cellRenderer: AgbuttonComponent,
			cellRendererParams: {
				clicked: (field: any) => {

					this.forwardSelectedMappingRequest(field);

				}
			},
		},

	];

  constructor(public industryService: IndustryService, private persistance: PersistenceService) {

	}

	onGridReady(params: any): void {

		this.gridApi = params.api;
	}

  
  ngOnInit(): void {
	this.currentUserId = this.persistance.getUserId()!;
    this.getApprovalsList();
  this.getMinorMappingApprovalsList();
  }

  getApprovalsList() {
		var uid = this.persistance.getUserUID();
		this.industryService.getMinorIndustryApprovalList(uid).subscribe({
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

	acceptSelectedRequests() {
		var sourece: Observable<any>[] = [];
		var selectedRows = this.gridApi?.getSelectedRows();
		selectedRows?.forEach((item) => {
			if (item.status == "Pending") {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,
					uid: item.uid
				};
				if (item.type == "Add Minor Industry" && item.createdBy != this.currentUserId && item.status == "Pending") {
					model.minorIndustryId = item.minorIndustryId;
					sourece.push(this.industryService.submitMinorIndustryApproved(model));
				}
			}
		});
		if (sourece.length > 0) {
			this.industryService.multipleAPIRequests(sourece).subscribe((result) => {
				
				console.log(result);
				this.reloaddata.emit();
			})
		}

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
				if (item.type == "Add Minor Industry") {
					model.minorIndustryId = item.minorIndustryId;
					sourece.push(this.industryService.submitMinorIndustryReject(model));
				}
			}
		});
		if (sourece.length > 0) {
			this.industryService.multipleAPIRequests(sourece).subscribe((result) => {
				
				console.log(result);
				this.reloaddata.emit();
			})
		}

	}

	forwardSelectedRequest(event: any) {
		if (event.data.status == "Pending") {
			var model: accessModel = {
				managerId: this.persistance.getManagerId(),
				createdBy: this.persistance.getUserId()!,
				uid: event.data.uid
			};
			if (event.data.type == "Add Major Industry") {
				model.majorIndustryId = event.data.majorIndustryId;
				this.industryService.submitMajorIndustryForward(model).subscribe((result: any) => {
					console.log(result);
					this.reloaddata.emit();
				});
			}
			else if (event.data.type == "Add Minor Industry") {
				model.minorIndustryId = event.data.minorIndustryId;
				this.industryService.submitMinorIndustryForward(model).subscribe((result: any) => {
					console.log(result);
					this.reloaddata.emit();
				});
			}
		}
	}

  onMappingGridReady(params: any): void {
		this.mappingGridApi = params.api;
	}

	getMinorMappingApprovalsList() {
		var uid = this.persistance.getUserUID();
		this.industryService.GetMajorMinorMappingApproval(uid).subscribe({
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
		selectedRows?.filter(f=>f.createdBy != this.currentUserId && f.status == "Pending").forEach((item) => {
			if (item.status == "Pending") {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,
					uid: item.uid,
					MajorMinorIndustryMappingId : item.MajorMinorIndustryMappingId,
					id:item.id
				};
				
				sourece.push(this.industryService.submitMajorMinorApproved(model));
			}
		});
		if (sourece.length > 0) {
			this.industryService.multipleAPIRequests(sourece).subscribe((result) => {
				
				console.log(result);
				this.reloaddata.emit();
			})
		}
	}

	rejectSelectedMappingRequests() {
		var sourece: Observable<any>[] = [];
		var selectedRows = this.mappingGridApi?.getSelectedRows();
		selectedRows?.filter(f=>f.createdBy != this.currentUserId && f.status == "Pending").forEach((item) => {
			if (item.status == "Pending") {
				var model: accessModel = {
					managerId: this.persistance.getManagerId(),
					createdBy: this.persistance.getUserId()!,
					uid: item.uid,
					MajorMinorIndustryMappingId : item.Id
				};
				
				sourece.push(this.industryService.submitMajorMinorReject(model));
			}
		});
		if (sourece.length > 0) {
			this.industryService.multipleAPIRequests(sourece).subscribe((result) => {
				
				console.log(result);
				this.reloaddata.emit();
			})
		}
	}

	forwardSelectedMappingRequest(event: any) {
		if (event.data.status == "Pending") {
			var model: accessModel = {
				managerId: this.persistance.getManagerId(),
				createdBy: this.persistance.getUserId()!,
				uid: event.data.uid,
				MajorMinorIndustryMappingId: event.data.Id
			};

			this.industryService.submitMajorMinorIndustryForward(model).subscribe((result: any) => {
				console.log(result);
				this.reloaddata.emit();
			});
		}
	}
}
