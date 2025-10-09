import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalDismissReasons, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { ColDef, GridApi } from 'ag-grid-community';
import { roles } from './roles';
import { AgDeleteButtonComponent } from '../../../../Components/ag-grid/ag-delete-button/ag-delete-button.component';
import { AgbuttonComponent } from '../../../../Components/ag-grid/agbutton/agbutton.component';
import { pendingApproval } from '../../../../models/pendingapproval';
import { RolesModels } from '../../../../models/roles';
import { ApiService } from '../../../../Services/api.service';

const defaultColumnDef = {
	editable: false,
	resizable: true,
	wrapText: true,
	autoHeight: true,
	sortable: true,
	angularCompileHeaders: true,
}

@Component({
	selector: 'app-roles',
	// imports: [NgbDatepickerModule],
	templateUrl: './roles.component.html',
	styleUrls: ['./roles.component.scss'],
	providers: [roles]
})

export class RolesComponent implements OnInit {

	public rowSelection: 'single' | 'multiple' = 'multiple';
	@ViewChild('addroleApporoval') addroleApporoval: any;
	pendingApproval: pendingApproval | undefined;

	@ViewChild('agGrid') agGrid: any;
	selectedRole: RolesModels = {};
	defaultColumnDef = defaultColumnDef;
	// private api: GridApi | undefined;
	columnDefs = [
		{ headerName: 'id', field: 'id', hide: true },
		{ headerName: 'uid', field: 'uid', hide: true },
		{ headerName: 'Role Display Name', field: 'roleDisplayName' },
		{ headerName: 'Category', field: 'roleName' },
		{
			headerName: 'Status', field: 'status',
			valueFormatter: function (param: any) {
				return param.value == 1 ? 'Active' : 'InActive';
			}
		},
		{
			field: 'Edit', width: 60,
			cellRenderer: AgbuttonComponent,
			cellRendererParams: {
				clicked: (field: any) => {
					this.selectedRole = { ...field.data };
					this.binddata(field.data);

				}
			},
		},
		// {
		// 	field: 'Delete', width: 80,
		// 	cellRenderer: AgDeleteButtonComponent,
		// 	cellRendererParams: {
		// 		clicked: (field: any) => {
		// 			//this.deleteUser(field.data.uid)
		// 		}
		// 	},
		// }

	];

	onGridReady(params: any): void {
		// this.api = params.api;
	}

	rowData: any[] = [];
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
		this.getAllRoles();
	}

	binddata(role: any) {
		this.selectedRole = { ...role };

	}

	closeResult = '';
	constructor(private modalService: NgbModal, public model: roles, public apiService: ApiService) { }

	ngOnInit(): void {
		this.getAllRoles()
	}

	openRoleReview(event: pendingApproval) {
		this.pendingApproval = event;
		this.openXl(this.addroleApporoval);
	}

	reloadPage(event: any) {
		this.getAllRoles();
		this.modalService.dismissAll(1);
	}

	open(content: any) {
		this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
			(result) => {
				this.closeResult = `Closed with: ${result}`;
			},
			(reason) => {
				this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
			},
		);
	}

	openXl(content: any) {
		this.modalService.open(content, { size: 'xl', centered: true });
	}
	private getDismissReason(reason: any): string {
		if (reason === ModalDismissReasons.ESC) {
			return 'by pressing ESC';
		} else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
			return 'by clicking on a backdrop';
		} else {
			return `with: ${reason}`;
		}
	}


	getAllRoles() {
		this.rowData = [];
		this.apiService.getAllRoles().subscribe((result: any) => {
			result.forEach((element: any) => {
				element.dummystatus = element.status == 1 ? 'Active' : 'InActive'
				element.Edit = "edit";
			});
			this.rowData = result;
		});
	}

	onFilterTextBoxChanged(event: any) {

		//this.api!.setQuickFilter(event.target.value);
	}
}
