import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ParameterList, ParameterModel } from 'src/app/Models/parameter';
import { pendingApproval } from 'src/app/Models/pendingapproval';
import { ParameterService } from 'src/app/Services/parameter.service';
import { ColDef, GridApi, ColumnApi } from 'ag-grid-community';
import { AgDeleteButtonComponent } from 'src/app/Components/ag-grid/ag-delete-button/ag-delete-button.component';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { NotifierService } from 'angular-notifier';
import { ParameterApprovalComponent } from '../parameter-approval/parameter-approval.component';
import { MenuOptionModel } from 'src/app/Models/Users';
import { PersistenceService } from 'src/app/Services/persistence.service';

const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
};
@Component({
  selector: 'app-parameter-setup',
  templateUrl: './parameter-setup.component.html',
  styleUrls: ['./parameter-setup.component.scss'],
})
export class ParameterSetupComponent {
  public rowSelection: 'single' | 'multiple' = 'multiple';
  @ViewChild('accessControl') accessControl: any;
  @ViewChild('addParameterApporoval') addParameterApporoval: any;
  pendingApproval: pendingApproval | undefined;
  @ViewChild('agGrid') agGrid: any;
  active = 5;
  selectedParameter: ParameterList = {};
  defaultColumnDef = defaultColumnDef;
  showapprovalButton: boolean = false;
  showAddNewParameterButton: boolean = false;
  parameterApprovalCount: string = '.';
  private api: GridApi | undefined;
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
    { headerName: 'ParameterName', field: 'fullName', width: 150 },
    { headerName: 'ParameterType', field: 'email', width: 210 },
    {
      headerName: 'Status',
      field: 'dummystatus',
      width: 100,
      cellRenderer: AgbuttonComponent,
    },
    {
      headerName: 'Control',
      field: 'Control',
      width: 150,
      cellRenderer: AgbuttonComponent,
      cellRendererParams: {
        clicked: (field: any) => {
          if (field.data.status == 1) {
            this.selectedParameter = { ...field.data };
            this.pendingApproval = { userUID: this.selectedParameter.uid! };
            this.openXl(this.accessControl);
          }
        },
      },
    },
    {
      field: 'Edit',
      width: 60,
      cellRenderer: AgbuttonComponent,
      cellRendererParams: {
        clicked: (field: any) => {
          this.selectedParameter = { ...field.data };
          this.binddata(field.data);
        },
      },
    },
    {
      field: 'Delete',
      width: 80,
      wrapText: true,
      cellRenderer: AgDeleteButtonComponent,
      cellRendererParams: {
        clicked: (field: any) => {
          this.deleteParameter(field.data.uid);
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
    selectedRows.map((row: any) => {});
  }

  reload(event: any) {
    this.getParameters();
  }

  binddata(parameter: any) {
    this.selectedParameter = { ...parameter };
  }
  closeResult = '';
  parameters: ParameterModel[] = [];
  parameterList: ParameterList[] = [];
  parameterbyId: ParameterModel[] = [];
  parameterCountryText: string = '';

  constructor(
    private modalService: NgbModal,
    private parameterservice: ParameterService,
    private notifier: NotifierService,
    private persistenceService: PersistenceService
  ) {}

  ngOnInit(): void {
    this.getParameters();

    var roleMenuOptions =
      this.persistenceService.getSessionStorage('menuOptions');
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 11
      var menuOptions = roleMenuOptions.filter(
        (option: MenuOptionModel) => option.parentId === 12
      );
      console.log('parameter setup Menu Options:', menuOptions);
      if (menuOptions.length > 0) {
        this.showAddNewParameterButton =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'Add New Parameter' && option.canView
          ).length > 0;
        this.showapprovalButton =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'APPROVALS' && option.canView
          ).length > 0;
      }
    }
  }

  selectedParameters: string[] = [];
  searchParameterText: string = '';

  openAccessControl() {
    this.openXl(this.accessControl);
  }

  openParameterReview(event: pendingApproval) {
    this.pendingApproval = event;
    this.openXl(this.addParameterApporoval);
  }

  openParameterAccessReview(event: pendingApproval) {
    this.pendingApproval = event;
    this.pendingApproval.review = true;
    this.openXl(this.accessControl);
  }
  getParameters() {
    this.parameterservice
      .getAllParameters()
      .subscribe((result: ParameterModel[]) => {
        this.parameters = result;
        if (this.parameters.length > 0) {
          this.selectedParameters.push(this.parameters[0].parameterName!);
        }
      });
  }

  toggleSelection(parameter: string) {
    if (this.isSelected(parameter)) {
      this.selectedParameters = this.selectedParameters.filter(
        (c) => c !== parameter
      );
    } else {
      this.selectedParameters.push(parameter);
    }
  }

  isSelected(parameter: string) {
    return this.selectedParameters.includes(parameter);
  }

  getParameterById(Id: any) {
    this.parameterservice.getParameterById(Id).subscribe((result: any) => {
      this.parameterbyId = result;
    });
  }

  getSelectedParameter() {
    var newArray = this.parameters; //.filter(item => this.selectedParameters.includes(item.parameterName!));
    if (this.searchParameterText != '')
      return newArray.filter((item) => !item.hide);
    else return newArray;
  }

  searchParameter(event: any) {
    this.parameters.filter((parameter) => {
      if (
        parameter.parameterName &&
        parameter.parameterName
          .toLowerCase()
          .includes(event.target.value.toLowerCase())
      ) {
        parameter.hide = false;
        return true;
      } else {
        parameter.hide = true;
        return false;
      }
    });
  }

  deleteParameter(uid: any) {
    this.parameterservice
      .delteParameterByUID(uid)
      .subscribe((result: ParameterModel) => {
        if (result.responseCode == 1) {
          this.reload(result);
          this.notifier.notify('error', 'Deleted Successfully');
        } else {
          this.notifier.notify('error', result.responseMessage);
        }
      });
  }

  reloadPage(event: any) {
    this.getParameters();
    this.modalService.dismissAll();
  }

  open(content: any) {
    this.modalService
      .open(content, { ariaLabelledBy: 'modal-basic-title' })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }
  openXl(content: any) {
    this.modalService.open(content, { size: 'xl', centered: true });
  }
  openParameterApproverModal() {
    this.modalService.open(ParameterApprovalComponent, {
      size: 'xl',
      centered: true,
    });
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
