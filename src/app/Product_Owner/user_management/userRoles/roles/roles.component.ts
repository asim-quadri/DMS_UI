import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalDismissReasons, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColDef, GridApi, ColumnApi } from 'ag-grid-community';
import { ApiService } from 'src/app/Services/api.service';
import { roles } from './roles';
import { AgDeleteButtonComponent } from 'src/app/Components/ag-grid/ag-delete-button/ag-delete-button.component';
import { AgbuttonComponent } from '../../../../Components/ag-grid/agbutton/agbutton.component';
import { RolesModels } from 'src/app/Models/roles';
import { MenuOptionModel } from 'src/app/Models/Users';
import { pendingApproval } from '../../../../Models/pendingapproval';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RoleApprovalComponent } from '../role-approval/role-approval.component';

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
	showUsersButton = true;
	@ViewChild('agGrid') agGrid: any;
	selectedRole: RolesModels = {};
	defaultColumnDef = defaultColumnDef;
	showSaveButton : boolean = false;
	showApprovalButton : boolean = false;
	rolesApprovalCount: string = '.';
	private api: GridApi | undefined;
	columnDefs = [
		{ headerName: 'id', field: 'id', hide: true },
		{ headerName: 'uid', field: 'uid', hide: true },
		{ headerName: 'Role Display Name', field: 'roleDisplayName', width: 420, },
		{ headerName: 'Category', field: 'roleName', flex: 1, minWidth: 250, },
		{
			headerName: 'Status', field: 'status', width: 200,
			valueFormatter: function (param: any) {
				return param.value == 1 ? 'Active' : 'InActive';
			}
		},
		{
			field: 'Edit', width: 150,
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
		this.api = params.api;
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
	constructor(private modalService: NgbModal, public model: roles, public apiService: ApiService, private persistance: PersistenceService,) { }

	ngOnInit(): void {
		this.getAllRoles();
		console.log(this.persistance.getUserId());

		// this.apiService.getMenuOptionsByParentId(5, this.persistance.getUserId()!).subscribe((result: MenuOptionModel[]) => {		
		// 	  console.log(result);	  
		// 	  this.showUsersButton = result.some(option => option.title === 'Users Screen' && option.canView);
		// 	});
		
		var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');
		if (roleMenuOptions && roleMenuOptions.length > 0) {
		//get menu options for for parentId = 43
		var menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 43);
		console.log('Roles setup Menu Options:', menuOptions);
		if (menuOptions.length > 0) {
			this.showSaveButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Save changes' && option.canView).length > 0;
			this.showApprovalButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'APPROVALS' && option.canView).length > 0;
		}
		}
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

	openApprovalModel(){
	this.modalService.open(RoleApprovalComponent, { size: 'xl', centered: true });	
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

		this.api!.setQuickFilter(event.target.value);
	}
}
