import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import {
  ModalDismissReasons,
  NgbActiveModal,
  NgbDatepickerModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { ColDef, GridApi, ColumnApi } from 'ag-grid-community';
import { CountryService } from 'src/app/Services/country.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { any, isElement } from 'underscore';
import { accessModel } from 'src/app/Models/pendingapproval';
import { Observable } from 'rxjs';
import { CountryStateApproval } from 'src/app/Models/countryModel';
import { NotifierService } from 'angular-notifier';

const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
};
@Component({
  selector: 'app-approval-countrystate',
  templateUrl: './approval-countrystate.component.html',
  styleUrls: ['./approval-countrystate.component.scss'],
})
export class ApprovalCountrystateComponent implements OnInit {
  public rowSelection: 'single' | 'multiple' = 'multiple';
  currentUserId = 0;
  selectedRecord: CountryStateApproval = {};
  @Input() active: number = 1;
  @Input()
  modal: any;
  countryMappingApprovals: string = '.';
  countryInsertApprovals: string = '.';
  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();
  @Output()
  public openCountryPopup: EventEmitter<CountryStateApproval> =
    new EventEmitter<CountryStateApproval>();
  private gridApi: GridApi | undefined;
  defaultColumnDef = defaultColumnDef;
  persistanceService: PersistenceService | undefined;
  rowData: any[] = [];
  ApprovalList: any[] = [];
  MappingList: any[] = [];
  columnDefs = [
    { headerName: 'uid', field: 'uid', hide: true },
    { headerName: 'countryId', field: 'countryId', hide: true },
    { headerName: 'stateId', field: 'stateId', hide: true },
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
    { headerName: 'Type', field: 'type', width: 120 },
    { headerName: 'Country', field: 'countryName', width: 120 },
    { headerName: 'Country Code', field: 'countryCode', width: 100 },
    { headerName: 'State/UT', field: 'stateName', width: 130 },
    { headerName: 'State Code', field: 'stateCode', width: 110 },
    { headerName: 'Financial Year', field: 'financialYear', width: 130 },
    { headerName: 'Point of Contact', field: 'fullName', width: 150 },
    { headerName: 'Approved By', field: 'approvedBy', width: 150 },
    // {
    // 	field: 'Edit',
    // 	width: 60,
    // 	cellRenderer: AgbuttonComponent,
    // 	cellRendererParams: {
    // 	  clicked: (field: any) => {
    // 		this.selectedRecord = { ...field.data };
    // 		//this.binddata(field.data);
    // 		this.openCountryPopup.emit(this.selectedRecord);
    // 	  },
    // 	},
    //   },
    {
      headerName: 'Status',
      field: 'status',
      width: 105,
      cellRenderer: AgbuttonComponent,
      cellRendererParams: {
        clicked: (field: any) => { },
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

  // Country State Mapping
  private mappingGridApi: GridApi | undefined;
  mappingRowData: any[] = [];
  mappingColumnDefs = [
    { headerName: 'uid', field: 'uid', hide: true },
    {
      headerName: 'countryStateMappingId',
      field: 'countryStateMappingId',
      hide: true,
    },
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

    { headerName: 'State/UT', field: 'stateName', flex: 1 },

    { headerName: 'Point of Contact', field: 'fullName', flex: 1 },
    { headerName: 'Approved By', field: 'approvedBy', flex: 1 },
    {
      headerName: 'Status',
      field: 'status',
      width: 110,
      cellRenderer: AgbuttonComponent,
      cellRendererParams: {
        clicked: (field: any) => { },
      },
      flex: 1,
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

  // Coutnry State Mapping End

  constructor(
    public countryService: CountryService,
    private persistance: PersistenceService,
    private notifier: NotifierService,
    @Optional() public activeModal: NgbActiveModal
  ) {
    this.persistanceService = this.persistance;
  }

  close() {
    (this.activeModal ?? this.modal)?.dismiss?.('dismissed');
  }

  onGridReady(params: any): void {
    this.gridApi = params.api;
  }

  ngOnInit(): void {
    this.currentUserId = this.persistance.getUserId()!;
    this.getMappingApprovalsList();
    this.getAllMappingApprovalsList();
    this.getApprovalsList();
    this.getAllApprovalsList();
  }

  getApprovalsList() {
    var uid = this.persistance.getUserUID();
    this.countryService.getCountrySateApprovalList(uid).subscribe({
      next: (result: any) => {
        result.forEach((item: any) => {
          item.forward = 'Forward';
          item.Edit = 'edit';
        });
        this.rowData = result;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  getAllApprovalsList() {
    this.countryService.getAllCountrySateApprovalList().subscribe({
      next: (result: any) => {
        result.forEach((item: any) => {
          item.forward = 'Forward';
          item.Edit = 'edit';
        });
        this.ApprovalList = result;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  forwardSelectedRequest() {
    var sourece: Observable<any>[] = [];
    var selectedRows = this.gridApi?.getSelectedRows();
    selectedRows?.forEach((item) => {
      if (item.status == 'Pending') {
        var model: accessModel = {
          managerId: this.persistance.getManagerId(),
          createdBy: this.persistance.getUserId()!,
          uid: item.uid,
        };
        if (
          this.ApprovalList.find(
            (x) =>
              x.stateName == item.stateName &&
              x.status == 'Approved' &&
              item.type == 'Add State'
          )
        ) {
          this.notifier.notify(
            'error',
            'Already' + ' ' + item.stateName + ' ' + 'Is Approved'
          );
        } else if (
          this.ApprovalList.find(
            (x) =>
              x.countryName == item.countryName &&
              x.status == 'Approved' &&
              item.type == 'Add Country'
          )
        ) {
          this.notifier.notify(
            'error',
            'Already' + ' ' + item.countryName + ' ' + 'Is Approved'
          );
        } else if (
          item.type == 'Add Country' &&
          item.createdBy != this.currentUserId &&
          item.status == 'Pending'
        ) {
          model.countryId = item.countryId;
          sourece.push(this.countryService.submitCountryForward(model));
          this.getApprovalsList();
        } else if (
          item.type == 'Add State' &&
          item.createdBy != this.currentUserId &&
          item.status == 'Pending'
        ) {
          model.stateId = item.stateId;
          sourece.push(this.countryService.submitStateForward(model));
        }
      }
    });
    if (sourece.length > 0) {
      this.countryService.multipleAPIRequests(sourece).subscribe((result) => {
        console.log(result);
        this.getApprovalsList();
        this.reloaddata.emit();
      });
    }
    this.close();
  }

  acceptSelectedRequests() {
    var sourece: Observable<any>[] = [];
    var selectedRows = this.gridApi?.getSelectedRows();
    selectedRows?.forEach((item) => {
      if (item.status == 'Pending') {
        var model: accessModel = {
          managerId: this.persistance.getManagerId(),
          createdBy: this.persistance.getUserId()!,
          uid: item.uid,
        };
        if (
          this.ApprovalList.find(
            (x) =>
              x.stateName == item.stateName &&
              x.status == 'Approved' &&
              item.type == 'Add State'
          )
        ) {
          this.notifier.notify(
            'error',
            'Already' + ' ' + item.stateName + ' ' + 'Is Approved'
          );
        } else if (
          this.ApprovalList.find(
            (x) =>
              x.countryName == item.countryName &&
              x.status == 'Approved' &&
              item.type == 'Add Country'
          )
        ) {
          this.notifier.notify(
            'error',
            'Already' + ' ' + item.countryName + ' ' + 'Is Approved'
          );
        } else if (
          item.type == 'Add Country' &&
          item.createdBy != this.currentUserId &&
          item.status == 'Pending'
        ) {
          model.countryId = item.countryId;
          sourece.push(this.countryService.submitCountryApproved(model));
          this.getApprovalsList();
        } else if (
          item.type == 'Add State' &&
          item.createdBy != this.currentUserId &&
          item.status == 'Pending'
        ) {
          model.stateId = item.stateId;
          sourece.push(this.countryService.submitStateApproved(model));
        }
      }
    });
    if (sourece.length > 0) {
      this.countryService.multipleAPIRequests(sourece).subscribe((result) => {
        console.log(result);
        this.getApprovalsList();
        this.reloaddata.emit();
      });
    }
    this.close();

  }

  rejectSelectedRequests() {
    var sourece: Observable<any>[] = [];
    var selectedRows = this.gridApi?.getSelectedRows();
    selectedRows?.forEach((item) => {
      if (item.status == 'Pending') {
        var model: accessModel = {
          managerId: this.persistance.getManagerId(),
          createdBy: this.persistance.getUserId()!,
          uid: item.uid,
        };
        if (item.type == 'Add Country') {
          model.countryId = item.countryId;
          sourece.push(this.countryService.submitCountryReject(model));
        } else if (item.type == 'Add State') {
          model.stateId = item.stateId;
          sourece.push(this.countryService.submitStateReject(model));
          this.getApprovalsList();
        }
      }
    });
    if (sourece.length > 0) {
      this.countryService.multipleAPIRequests(sourece).subscribe((result) => {
        console.log(result);
        this.getApprovalsList();
        this.reloaddata.emit();
      });
    }
    this.close();

  }

  // Country State Mapping

  onMappingGridReady(params: any): void {
    this.mappingGridApi = params.api;
  }

  getMappingApprovalsList() {
    var uid = this.persistance.getUserUID();
    this.countryService.GetCountryStateMappingApproval(uid).subscribe({
      next: (result: any) => {
        result.forEach((item: any) => {
          item.forward = 'Forward';
        });
        this.mappingRowData = result;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  getAllMappingApprovalsList() {
    this.countryService.GetAllCountryStateMappingApproval().subscribe({
      next: (result: any) => {
        result.forEach((item: any) => {
          item.forward = 'Forward';
        });
        this.MappingList = result;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  acceptSelectedMappingRequests() {
    var sourece: Observable<any>[] = [];
    var selectedRows = this.mappingGridApi?.getSelectedRows();

    selectedRows
      ?.filter(
        (f) => f.createdBy != this.currentUserId && f.status == 'Pending'
      )
      .forEach((item) => {
        if (item.status == 'Pending') {
          var model: accessModel = {
            managerId: this.persistance.getManagerId(),
            createdBy: this.currentUserId,
            uid: item.uid,
            countryStateMappingId: item.countryStateMappingId,
            id: item.id,
          };
          if (
            this.MappingList.find(
              (x) =>
                x.stateName == item.stateName &&
                x.countryName == item.countryName &&
                x.status == 'Approved'
            )
          ) {
            this.notifier.notify(
              'error',
              'Already' +
              ' ' +
              item.countryName +
              ' ' +
              item.stateName +
              ' ' +
              'Is Approved'
            );
          } else {
            sourece.push(this.countryService.submitCountryStateApproved(model));
            this.getMappingApprovalsList();
          }
        }
      });
    if (sourece.length > 0) {
      this.countryService.multipleAPIRequests(sourece).subscribe((result) => {
        console.log(result);
        this.reloaddata.emit();
        this.getMappingApprovalsList();
      });
    }
    this.close();
  }

  forwordSelectedMappingRequests() {
    var sourece: Observable<any>[] = [];
    var selectedRows = this.mappingGridApi?.getSelectedRows();

    selectedRows
      ?.filter(
        (f) => f.createdBy != this.currentUserId && f.status == 'Pending'
      )
      .forEach((item) => {
        if (item.status == 'Pending') {
          var model: accessModel = {
            managerId: this.persistance.getManagerId(),
            createdBy: this.currentUserId,
            uid: item.uid,
            countryStateMappingId: item.countryStateMappingId,
            id: item.id,
          };
          if (
            this.MappingList.find(
              (x) =>
                x.stateName == item.stateName &&
                x.countryName == item.countryName &&
                x.status == 'Approved'
            )
          ) {
            this.notifier.notify(
              'error',
              'Already' +
              ' ' +
              item.countryName +
              ' ' +
              item.stateName +
              ' ' +
              'Is Approved'
            );
          } else {
            sourece.push(this.countryService.submitCountryStateApproved(model));
            this.getMappingApprovalsList();
          }
        }
      });
    if (sourece.length > 0) {
      this.countryService.multipleAPIRequests(sourece).subscribe((result) => {
        console.log(result);
        this.reloaddata.emit();
        this.getMappingApprovalsList();
      });
    }
    this.close();
  }

  rejectSelectedMappingRequests() {
    var sourece: Observable<any>[] = [];
    var selectedRows = this.mappingGridApi?.getSelectedRows();
    selectedRows
      ?.filter(
        (f) => f.createdBy != this.currentUserId && f.status == 'Pending'
      )
      .forEach((item) => {
        if (item.status == 'Pending') {
          var model: accessModel = {
            managerId: this.persistance.getManagerId(),
            createdBy: this.currentUserId,
            uid: item.uid,
            countryStateMappingId: item.id,
          };

          sourece.push(this.countryService.submitCountryStateReject(model));
          this.getMappingApprovalsList();
        }
      });
    if (sourece.length > 0) {
      this.countryService.multipleAPIRequests(sourece).subscribe((result) => {
        console.log(result);
        this.getMappingApprovalsList();
        this.reloaddata.emit();
      });
    }
    this.close();
  }

  onFilterCountryMappingChanged(event: any) {
    this.mappingGridApi!.setQuickFilter(event.target.value);
  }

  onFilterTextBoxChanged(event: any) {
    this.gridApi!.setQuickFilter(event.target.value);
  }

  // Coutnry State Mapping End
}
