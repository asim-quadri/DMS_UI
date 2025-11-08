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
import { ColDef, GridApi, ColumnApi } from 'ag-grid-community';
import { AgbuttonComponent } from '../../../../Components/ag-grid/agbutton/agbutton.component';
import { IndustryService } from '../../../../Services/industry.service';
import { PersistenceService } from '../../../../Services/persistence.service';
import { Observable } from 'rxjs';
import { accessModel } from '../../../../Models/pendingapproval';
import { CountryMajorApproval } from 'src/app/Models/industrysetupModel';

const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
};

@Component({
  selector: 'app-approval-countrymajor-industry',
  templateUrl: './approval-countrymajor-industry.component.html',
  styleUrls: ['./approval-countrymajor-industry.component.scss'],
})
export class ApprovalCountrymajorIndustryComponent {
  public rowSelection: 'single' | 'multiple' = 'multiple';
  @Input() active: number = 1;
  currentUserId = 0;
  roleName = '';
  //selectedRecord: CountryMajorApproval = {};
  @Input()
  modal: any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();
  private gridApi: GridApi | undefined;
  defaultColumnDef = defaultColumnDef;
  persistanceService: PersistenceService | undefined;
  rowData: any[] = [];
  approvalCountryMajorIndustryMapping: string = '.';
  approvalCountryMajorIndustryInsertion: string = '.';
  columnDefs = [
    { headerName: 'uid', field: 'uid', hide: true },
    { headerName: 'createdBy', field: 'createdBy', hide: true },
    { headerName: 'majorIndustryId', field: 'majorIndustryId', hide: true },
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
    {
      headerName: 'MajorIndustry Name',
      field: 'majorIndustryName',
      width: 180,
    },
    {
      headerName: 'MajorIndustry Code',
      field: 'majorIndustryCode',
      width: 180,
    },
    {
      headerName: 'MinorIndustry Name',
      field: 'minorIndustryName',
      width: 180,
    },
    {
      headerName: 'MinorIndustry Code',
      field: 'minorIndustryCode',
      width: 180,
    },
    { headerName: 'Point of Contact', field: 'fullName', width: 180 },
    { headerName: 'Approved By', field: 'approvedBy', width: 150 },
    {
      headerName: 'Status',
      field: 'status',
      width: 110,
      cellRenderer: AgbuttonComponent,
      cellRendererParams: {
        clicked: (field: any) => {},
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
  // Coutnry Major Industry Mapping
  private mappingGridApi: GridApi | undefined;
  mappingRowData: any[] = [];
  mappingColumnDefs = [
    { headerName: 'uid', field: 'uid', hide: true },
    { headerName: 'IndustryMappingId', field: 'industryMappingId', hide: true },
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

    { headerName: 'Major Industry', field: 'majorIndustryName', flex: 1 },

    { headerName: 'Minor Industry', field: 'minorIndustryName', flex: 1 },

    { headerName: 'Point of Contact', field: 'fullName', flex: 1 },
    { headerName: 'Approved By', field: 'approvedBy', flex: 1 },
    {
      headerName: 'Status',
      field: 'status',
      flex: 1,
      cellRenderer: AgbuttonComponent,
      cellRendererParams: {
        clicked: (field: any) => {},
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

  constructor(
    public industryService: IndustryService,
    private persistance: PersistenceService,
    @Optional() public activeModal: NgbActiveModal
  ) {
    this.persistanceService = this.persistance;
  }

  onGridReady(params: any): void {
    this.gridApi = params.api;
  }

  ngOnInit(): void {
    this.currentUserId = this.persistance.getUserId()!;
    this.roleName = this.persistance.getRole()!;
    this.getApprovalsList();
    this.getMajorMappingApprovalsList();
  }

  getApprovalsList() {
    var uid = this.persistance.getUserUID();
    this.industryService.getMajorMinorApprovalList(uid).subscribe({
      next: (result: any) => {
        result.forEach((item: any) => {
          item.forward = 'Forward';
        });
        this.rowData = result;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
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
          item.type == 'Add Major Industry' &&
          item.status == 'Pending' &&
          item.createdBy != this.currentUserId
        ) {
          model.majorIndustryId = item.majorIndustryId;
          sourece.push(this.industryService.submitMajorIndustryApproved(model));
          this.getApprovalsList();
        } else if (
          item.type == 'Add Minor Industry' &&
          item.status == 'Pending' &&
          item.createdBy != this.currentUserId
        ) {
          model.minorIndustryId = item.minorIndustryId;
          sourece.push(this.industryService.submitMinorIndustryApproved(model));
          this.getApprovalsList();
        }
      }
    });
    if (sourece.length > 0) {
      this.industryService.multipleAPIRequests(sourece).subscribe((result) => {
        this.getApprovalsList();
        console.log(result);
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
        if (item.type == 'Add Major Industry') {
          model.majorIndustryId = item.majorIndustryId;
          sourece.push(this.industryService.submitMajorIndustryReject(model));
          this.getApprovalsList();
        } else if (item.type == 'Add Minor Industry') {
          model.stateId = item.stateId;
          sourece.push(this.industryService.submitMinorIndustryReject(model));
          this.getApprovalsList();
        }
      }
    });
    if (sourece.length > 0) {
      this.industryService.multipleAPIRequests(sourece).subscribe((result) => {
        this.getApprovalsList();
        console.log(result);
        this.reloaddata.emit();
      });
    }
    this.close();
  }

  // forwardSelectedRequest(event: any) {
  //   if (event.data.status == 'Pending') {
  //     var model: accessModel = {
  //       managerId: this.persistance.getManagerId(),
  //       createdBy: this.persistance.getUserId()!,
  //       uid: event.data.uid,
  //     };
  //     if (event.data.type == 'Add Major Industry') {
  //       model.majorIndustryId = event.data.majorIndustryId;
  //       this.industryService
  //         .submitMajorIndustryForward(model)
  //         .subscribe((result: any) => {
  //           console.log(result);
  //           this.reloaddata.emit();
  //         });
  //     } else if (event.data.type == 'Add Minor Industry') {
  //       model.minorIndustryId = event.data.minorIndustryId;
  //       this.industryService
  //         .submitMinorIndustryForward(model)
  //         .subscribe((result: any) => {
  //           console.log(result);
  //           this.reloaddata.emit();
  //         });
  //     }
  //   }
  // }
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
          item.type == 'Add Major Industry' &&
          item.status == 'Pending' &&
          item.createdBy != this.currentUserId
        ) {
          model.majorIndustryId = item.majorIndustryId;
          sourece.push(this.industryService.submitMajorIndustryForward(model));
          this.getApprovalsList();
        } else if (
          item.type == 'Add Minor Industry' &&
          item.status == 'Pending' &&
          item.createdBy != this.currentUserId
        ) {
          model.minorIndustryId = item.minorIndustryId;
          sourece.push(this.industryService.submitMinorIndustryForward(model));
          this.getApprovalsList();
        }
      }
    });
    if (sourece.length > 0) {
      this.industryService.multipleAPIRequests(sourece).subscribe((result) => {
        this.getApprovalsList();
        console.log(result);
        this.reloaddata.emit();
      });
    }
    this.close();
  }
  onMappingGridReady(params: any): void {
    this.mappingGridApi = params.api;
  }

  // Get Major Mapping Approvals List
  getMajorMappingApprovalsList() {
    var uid = this.persistance.getUserUID();
    this.industryService.GetIndustryMappingApproval(uid).subscribe({
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

  // forwardSelectedMappingRequest(event: any) {
  //   if (event.data.status == 'Pending') {
  //     var model: accessModel = {
  //       managerId: this.persistance.getManagerId(),
  //       createdBy: this.persistance.getUserId()!,
  //       uid: event.data.uid,
  //       countryMajorIndustryMappingId: event.data.Id,
  //     };

  //     this.industryService
  //       .submitCountryMajorIndustryForward(model)
  //       .subscribe((result: any) => {
  //         console.log(result);
  //         this.reloaddata.emit();
  //       });
  //   }
  // }

  forwardSelectedMappingRequest() {
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
            IndustryMappingId: item.industryMappingId,
            id: item.id,
          };

          sourece.push(
            this.industryService.submitMajorMinorIndustryForward(model)
          );
          this.getMajorMappingApprovalsList();
        }
      });
    if (sourece.length > 0) {
      this.industryService.multipleAPIRequests(sourece).subscribe((result) => {
        this.getMajorMappingApprovalsList();
        console.log(result);
        this.reloaddata.emit();
      });
    }
    this.close();
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
            IndustryMappingId: item.industryMappingId,
            id: item.id,
          };

          sourece.push(this.industryService.submitCountryMajorApproved(model));
          this.getMajorMappingApprovalsList();
        }
      });
    if (sourece.length > 0) {
      this.industryService.multipleAPIRequests(sourece).subscribe((result) => {
        this.getMajorMappingApprovalsList();
        console.log(result);
        this.reloaddata.emit();
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
            createdBy: this.persistance.getUserId()!,
            uid: item.uid,
            countryMajorIndustryMappingId: item.Id,
          };

          sourece.push(this.industryService.submitCountryMajorReject(model));
          this.getMajorMappingApprovalsList();
        }
      });
    if (sourece.length > 0) {
      this.industryService.multipleAPIRequests(sourece).subscribe((result) => {
        console.log(result);
        this.getMajorMappingApprovalsList();
        this.reloaddata.emit();
      });
    }
    this.close();
  }

  getMinorMappingApprovalsList() {
    var uid = this.persistance.getUserUID();
    this.industryService.GetMajorMinorMappingApproval(uid).subscribe({
      next: (result: any) => {
        this.mappingRowData = result;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  close() {
    (this.activeModal ?? this.modal)?.dismiss?.('dismissed');
  }
}
