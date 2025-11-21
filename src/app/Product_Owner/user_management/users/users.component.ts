import { Component, OnInit, ViewChild } from '@angular/core';
import {
  ModalDismissReasons,
  NgbDatepickerModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { users } from './users';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { ApiService } from 'src/app/Services/api.service';
import { UsersModel } from 'src/app/Models/Users';
import { AgDeleteButtonComponent } from 'src/app/Components/ag-grid/ag-delete-button/ag-delete-button.component';
import { NotifierService } from 'angular-notifier';
import { ColDef, GridApi, ColumnApi } from 'ag-grid-community';
import { pendingApproval } from 'src/app/Models/pendingapproval';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { MenuOptionModel } from 'src/app/Models/Users';
import { any } from 'underscore';
import { UserApprovalComponent } from '../user-approval/user-approval.component';

const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
  pagination: true
};
@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  providers: [users],
})
export class UsersComponent implements OnInit {
  public rowSelection: 'single' | 'multiple' = 'multiple';
  @ViewChild('accessControl') accessControl: any;
  @ViewChild('adduserApporoval') adduserApporoval: any;
  pendingApproval: pendingApproval | undefined;
  userApprovalCount: string = '.';

  @ViewChild('agGrid') agGrid: any;
  userManagementOptions: MenuOptionModel[] = [];
  showRolesButton = true;
  showAccessControlButton = false;
  selectedUser: UsersModel = {};
  defaultColumnDef = defaultColumnDef;
  private api: GridApi | undefined;
  roleId = this.persistenceService.getRoleId();
  showSaveButton = false;
  showApprovalButton = false;
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
    { headerName: 'id', field: 'id', hide: true },
    { headerName: 'uid', field: 'uid', hide: true },
    { headerName: 'Full Name', field: 'fullName', width: 250 },
    // { headerName: 'Email', field: 'email', width: 210 },
    { headerName: 'Role', field: 'roleDisplayName', width: 200 },
    { headerName: 'RoleId', field: 'roleId', hide: true },
    {
      headerName: 'Created Date',
      field: 'createdOn',
      width: 150,
      valueFormatter: function (param: any) {
        return param.value.split('T')[0];
      },
    },
    {
      headerName: 'Modified Date',
      field: 'modifiedOn',
      width: 150,
      valueFormatter: function (param: any) {
        if (param.value)
          return param.value.split('T')[0];
      },
    },
    {
      headerName: 'Status',
      field: 'dummystatus',
      width: 100,
      cellRenderer: AgbuttonComponent,
    },

    {
      field: 'Edit',
      width: 100,
      cellRenderer: AgbuttonComponent,
      cellRendererParams: {
        clicked: (field: any) => {
          this.selectedUser = { ...field.data };
          this.binddata(field.data);
        },
      },
    },
    {
      field: 'Disable',
      width: 120,
      wrapText: true,
      cellRenderer: AgDeleteButtonComponent,
      cellRendererParams: {
        clicked: (field: any) => {
          this.deleteUser(field.data.uid);
        },
      },
    },
  ];

  onGridReady(params: any): void {
    this.api = params.api;
  }

  onFilterTextBoxChanged(event: any) {

    this.api!.setQuickFilter(event.target.value);
  }

  rowData: any[] = [];
  getTabledata() {
    let selectedRows;
    selectedRows = this.agGrid.getSelectedRows();
    ///than you can map your selectedRows
    selectedRows.map((row: any) => { });
  }

  reload(event: any) {
    this.getAllUser();
  }

  binddata(user: any) {
    this.selectedUser = { ...user };
  }

  deleteUser(uid: any) {
    this.apiService.delteUserByUID(uid).subscribe((result: UsersModel) => {
      if (result.responseCode == 1) {
        this.reload(result);
        this.notifier.notify('error', 'Deleted Successfully');
      } else {
        this.notifier.notify('error', result.responseMessage);
      }
    });
  }

  // Create a function to handle form submission
  onSubmit() {
    // Handle form submission logic here
  }

  closeResult = '';
  active = 1;

  constructor(
    private modalService: NgbModal,
    public model: users,
    public apiService: ApiService,
    private notifier: NotifierService,
    private persistenceService: PersistenceService
  ) { }

  ngOnInit(): void {
    this.getAllUser();
    this.apiService.getMenuOptionsByParentId(5, this.persistenceService.getUserId()!).subscribe((result: MenuOptionModel[]) => {
      this.userManagementOptions = result;
     // this.showRolesButton = result.some(option => option.title === 'Roles Screen' && option.canView);
      this.showAccessControlButton = result.some(option => option.title.toLowerCase() === 'access control screen' && option.canView);
      if (this.showAccessControlButton) {
        const controlColumn = {
          headerName: 'Control',
          field: 'Control',
          width: 150,
          cellRenderer: AgbuttonComponent,
          cellRendererParams: {
            clicked: (field: any) => {
              if (field.data.status == 1) {
                this.selectedUser = { ...field.data };
                this.pendingApproval = { userUID: this.selectedUser.uid! };
                this.openXl(this.accessControl);
              }
            },
          },
        } as any;
        this.columnDefs = [
          ...this.columnDefs.slice(0, 5),
          controlColumn,
          ...this.columnDefs.slice(5)
        ];
      }
    });
    var roleMenuOptions = this.persistenceService.getSessionStorage('menuOptions');
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 44
      var menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 44);
      console.log('Users setup Menu Options:', menuOptions);
      if (menuOptions.length > 0) {
        this.showSaveButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Save User' && option.canView).length > 0;
        this.showApprovalButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'APPROVALS' && option.canView).length > 0;
      }
    }
  }

  openUserReview(event: pendingApproval) {
    this.pendingApproval = event;
    this.openXl(this.adduserApporoval);
  }

  openUserAccessReview(event: pendingApproval) {
    this.pendingApproval = event;
    this.pendingApproval.review = true;
    this.openXl(this.accessControl);
  }

  getAllUser() {
    this.rowData = [];
    // const roleId = this.persistenceService.getRoleId();
    // console.log('Role ID:', roleId);
    this.apiService.getAllUsers().subscribe((result: any) => {
      result.forEach((element: any) => {
        element.dummystatus = element.status == 1 ? 'Active' : 'InActive';
        element.Control = 'control';
        element.Edit = 'edit';
      });
      this.rowData = result;
    });
  }

  reloadPage(event: any) {
    this.getAllUser();
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

   openUserApproverModal() {
    this.modalService.open(UserApprovalComponent, { size: 'xl', centered: true });
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
}
