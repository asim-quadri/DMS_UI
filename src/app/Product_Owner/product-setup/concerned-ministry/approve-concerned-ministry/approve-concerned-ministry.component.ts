import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid-community';
import { NotifierService } from 'angular-notifier';
import { Observable } from 'rxjs';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { RefApprovalStatus } from 'src/app/enums/enums';
import { CountryConcernedMinistryMapping, postConcernedMinistry } from 'src/app/Models/postConcernedMinistry';
import { ConcernedMinistryService } from 'src/app/Services/concerned-ministry.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulatoryAuthorityService } from 'src/app/Services/regulatory-authorities.service';
const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
};
@Component({
  selector: 'app-approve-concerned-ministry',
  templateUrl: './approve-concerned-ministry.component.html',
  styleUrls: ['./approve-concerned-ministry.component.scss'],
})
export class ApproveConcernedMinistryComponent implements OnInit {
  insertionConcernedMinistryApprovalCount: string = '.';
  public rowSelection: 'single' | 'multiple' = 'multiple';
  active = 1;
  @Input()
  modal: any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();
  private gridApi: GridApi | undefined;

  defaultColumnDef: typeof defaultColumnDef = defaultColumnDef;
  rowData: any[] = [];
  approvalList: any[] = [];
  mappingList: any[] = [];
  approvalConcernedMinistryMappingCount: string = '.';
  columnDefs = [
    { headerName: 'uid', field: 'uid', hide: true },
    {
      field: 'RowSelect',
      headerName: ' ',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      suppressMenu: true,
      suppressSorting: true,
      width: 50,
    },
    {
      headerName: 'Concerned Ministry',
      field: 'concernedMinistryName',
      flex: 1,
    },
    {
      headerName: 'Concerned Ministry Code',
      field: 'concernedMinistryCode',
      flex: 1,
    },
    { headerName: 'Point of Contact', field: 'userName', flex: 1 },
    { headerName: 'Approved By', field: 'managerName', flex: 1 },
    {
      headerName: 'Status',
      field: 'approveStatus',
      flex: 1,
      cellRenderer: AgbuttonComponent,
      cellRendererParams: {
        clicked: (field: any) => {},
      },
    },
  ];

  private mappingGridApi: GridApi | undefined;
  mappingRowData: any[] = [];
  mappingColumnDefs = [
    { headerName: 'uid', field: 'uid', hide: true },
    { headerName: 'countryId', field: 'countryId', hide: true },
    {
      headerName: 'id',
      field: 'id',
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

    {
      headerName: 'Concerned Ministry',
      field: 'concernedMinistryName',
      flex: 1,
    },

    { headerName: 'Point of Contact', field: 'userName', flex: 1 },
    { headerName: 'Approved By', field: 'managerName', flex: 1 },
    {
      headerName: 'Status',
      field: 'approveStatus',
      flex: 1,
      cellRenderer: AgbuttonComponent,
      cellRendererParams: {
        clicked: (field: any) => {},
      },
    },
  ];
  persistenceService: PersistenceService;
  constructor(
    private concernedMinistryAuthService: ConcernedMinistryService,
    private persistence: PersistenceService,
    private notifier: NotifierService,
    @Optional() public activeModal: NgbActiveModal
  ) {
    this.persistenceService = this.persistence;
  }
  ngOnInit(): void {
    this.getPendingConcernedMinistryApprovalsList();
    this.getAllPendingConcernedMinistryMappingList();
    this.getAllConcernedMinistryMappingApprovalsList();
    this.getAllConcernedMinistryApprovalsList();
  }
  onGridReady(params: any): void {
    this.gridApi = params.api;
  }
  onMappingGridReady(params: any): void {
    this.mappingGridApi = params.api;
  }

  onFilterCountryConcernedMinistryMappingChanged(event: any) {
    this.mappingGridApi!.setQuickFilter(event.target.value);
  }

  forwardSelectedMappingConcernedMinistryRequest() {

      var sourceConMin: Observable<any>[] = [];
        var selectedRows = this.mappingGridApi?.getSelectedRows();
        selectedRows?.forEach((item) => {
    
          if (item.status == "Pending" && item.createdBy != this.persistence.getUserId()) {
            var model: CountryConcernedMinistryMapping = {
               managerId: this.persistence.getManagerId() ?? 0,
              modifiedBy: this.persistence.getUserId()! ?? 0,
              createdBy: item.createdBy,
              uid: item.uid,
              id: item.id,
              approveStatus: RefApprovalStatus.Forward.toString(),
              concernedMinistryName: item.concernedMinistryName,
              concernedMinistryId: item.concernedMinistryId,
              countryId: item.countryId,
              countryName: item.countryName,
              status: 1,
              createdOn: item.CreatedOn,
              managerName: item.managerName,
              userName: item.userName,
            };
            if (this.mappingList.find(x => x.concernedMinistryName == item.concernedMinistryName && x.countryName == item.countryName && x.status == "Approved")) {
              this.notifier.notify("error", "Already" + ' ' + item.countryName + item.concernedMinistryName + ' ' + "Is Approved");
            }
            sourceConMin.push(this.concernedMinistryAuthService.submitConcernedMinistriesMappingApprove(model));
          }
        });
        if (sourceConMin.length > 0) {
          this.concernedMinistryAuthService.multipleAPIRequests(sourceConMin).subscribe((result) => {
    
            console.log(result);
            this.reloaddata.emit();
          })
        }
        this.closeApproveConcernedMinistry();
  }

    getAllConcernedMinistryMappingApprovalsList() {
    this.concernedMinistryAuthService.getAllConcernedMinistryMapping().subscribe({
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
    getAllConcernedMinistryApprovalsList() {
    this.concernedMinistryAuthService.getAllConcernedMinistry().subscribe({
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

  
  acceptSelectedConcernedMinistryMappingRequests() {
     var sourceMappingApproveConMin: Observable<any>[] = [];
        var selectedInsertionRegAuthRows = this.mappingGridApi?.getSelectedRows();
        selectedInsertionRegAuthRows?.forEach((item) => {
          if (
            item.approveStatus == 'Pending' &&
            item.createdBy != this.persistence.getUserId()
          ) {
            var model: CountryConcernedMinistryMapping = {
              managerId: this.persistence.getManagerId() ?? 0,
              modifiedBy: this.persistence.getUserId()! ?? 0,
              createdBy: item.createdBy,
              uid: item.uid,
              id: item.id,
              approveStatus: RefApprovalStatus.Approved.toString(),
              concernedMinistryName: item.concernedMinistryName,
              concernedMinistryId: item.concernedMinistryId,
              countryId: item.countryId,
              countryName: item.countryName,
              status: 1,
              createdOn: item.CreatedOn,
              managerName: item.managerName,
              userName: item.userName,
            };
            if (
              this.approvalList.find(
                (x) =>
                  x.regulatoryAuthorityId == item.regulatoryAuthorityId &&
                  x.approveStatus == 'Approved'
              )
            ) {
              this.notifier.notify(
                'error',
                'Already' + ' ' + item.concernedMinistryName + ' ' + 'Is Approved'
              );
            }
            sourceMappingApproveConMin.push(
              this.concernedMinistryAuthService.submitConcernedMinistriesMappingApprove(
                model
              )
            );
          }
        });
        if (sourceMappingApproveConMin.length > 0) {
          this.concernedMinistryAuthService
            .multipleAPIRequests(sourceMappingApproveConMin)
            .subscribe((result) => {
              this.notifier.notify(
                'success',
                'Selected Concerned Ministry Mapping Requests are Approved'
              );
              console.log(result);
              this.reloaddata.emit();
            });
        }
        this.closeApproveConcernedMinistry();
  }
  rejectSelectedConcernedMinistryMappingRequests() {

     var sourceRejectMappingConMin: Observable<any>[] = [];
        var selectedInsertionRegAuthRows = this.mappingGridApi?.getSelectedRows();
        selectedInsertionRegAuthRows?.forEach((item) => {
          if (
            item.approveStatus == 'Pending' &&
            item.createdBy != this.persistence.getUserId()
          ) {
            var model: CountryConcernedMinistryMapping = {
              managerId: this.persistence.getManagerId() ?? 0,
              modifiedBy: this.persistence.getUserId()! ?? 0,
              createdBy: item.createdBy,
              uid: item.uid,
              id: item.id,
              approveStatus: RefApprovalStatus.Rejected.toString(),
              concernedMinistryName: item.concernedMinistryName,
              concernedMinistryId: item.concernedMinistryId,
              countryId: item.countryId,
              countryName: item.countryName,
              status: 1,
              createdOn: item.CreatedOn,
              managerName: item.managerName,
              userName: item.userName,
            };
     sourceRejectMappingConMin.push(
              this.concernedMinistryAuthService.submitConcernedMinistriesMappingApprove(model)
            );
          }
        });
        if (sourceRejectMappingConMin.length > 0) {
          this.concernedMinistryAuthService
            .multipleAPIRequests(sourceRejectMappingConMin)
            .subscribe((result: any) => {
              this.notifier.notify('success', result[0].message?? 'Concerned ministry Mapping rejected successfully.');
              this.reloaddata.emit();
            });
        }
        this.closeApproveConcernedMinistry();
  }
  approveSelectedConcernedMinistry() {
    var source: Observable<any>[] = [];
    var selectedInsertionRegAuthRows = this.gridApi?.getSelectedRows();
    selectedInsertionRegAuthRows?.forEach((item) => {
      if (
        item.approveStatus == 'Pending' &&
        item.createdBy != this.persistence.getUserId()
      ) {
        var model: postConcernedMinistry = {
          managerId: this.persistence.getManagerId() ?? 0,
          modifiedBy: this.persistence.getUserId()! ?? 0,
          createdBy: item.createdBy,
          uid: item.uid,
          id: item.id,
          approveStatus: RefApprovalStatus.Approved.toString(),
          concernedMinistryName: item.concernedMinistryName,
          concernedMinistryCode: item.concernedMinistryCode,
          concernedMinistryReferenceCode: item.concernedMinistryReferenceCode,
          status: 1,
          createdOn: item.createdOn,
          managerName: item.managerName,
          userName: item.userName,
        };
        if (
          this.approvalList.find(
            (x) =>
              x.regulatoryAuthorityReferenceCode ==
                item.regulatoryAuthorityReferenceCode &&
              x.approveStatus == 'Approved'
          )
        ) {
          this.notifier.notify(
            'error',
            'Already' + ' ' + item.concernedMinistryName + ' ' + 'Is Approved'
          );
        }
        source.push(
          this.concernedMinistryAuthService.submitConcernedMinistriesApprove(
            model
          )
        );
      }
    });
    if (source.length > 0) {
      this.concernedMinistryAuthService
        .multipleAPIRequests(source)
        .subscribe((result) => {
          console.log(result);
          this.reloaddata.emit();
        });
    }
    this.closeApproveConcernedMinistry();
  }
  rejectSelectedConcernedMinistry() {
     var sourceReject: Observable<any>[] = [];
        var selectedRows = this.gridApi?.getSelectedRows();
        selectedRows?.forEach((item) => {
          if (
            item.approveStatus == 'Pending' &&
            item.createdBy != this.persistence.getUserId()
          ) {
            var model: postConcernedMinistry = {
              managerId: this.persistence.getManagerId() ?? 0,
              modifiedBy: this.persistence.getUserId()! ?? 0,
              createdBy: item.createdBy,
              uid: item.uid,
              id: item.id,
              approveStatus: RefApprovalStatus.Rejected.toString(),
              concernedMinistryName: item.concernedMinistryName,
              concernedMinistryCode: item.concernedMinistryCode,
              concernedMinistryReferenceCode:
                item.concernedMinistryReferenceCode,
              status: 1,
              createdOn: item.CreatedOn,
              managerName: item.managerName,
              userName: item.userName,
            };
            sourceReject.push(
              this.concernedMinistryAuthService.submitConcernedMinistriesApprove(model)
            );
          }
        });
        if (sourceReject.length > 0) {
          this.concernedMinistryAuthService
            .multipleAPIRequests(sourceReject)
            .subscribe((result: any) => {
              this.notifier.notify('success', result.message);
              this.reloaddata.emit();
            });
        }
        this.closeApproveConcernedMinistry();
  }
  forwardSelectedConcernedMinistry() {
       var sourceForward: Observable<any>[] = [];
        var selectedRows = this.gridApi?.getSelectedRows();
        selectedRows?.forEach((item) => {
          if (
            item.approveStatus == 'Pending' &&
            item.createdBy != this.persistence.getUserId()
          ) {
            var model: postConcernedMinistry = {
              managerId: this.persistence.getManagerId() ?? 0,
              modifiedBy: this.persistence.getUserId()! ?? 0,
              createdBy: item.createdBy,
              uid: item.uid,
              id: item.id,
              approveStatus: RefApprovalStatus.Forward.toString(),
              concernedMinistryName: item.concernedMinistryName,
              concernedMinistryCode: item.concernedMinistryCode,
              concernedMinistryReferenceCode:
                item.concernedMinistryReferenceCode,
              status: 1,
              createdOn: item.CreatedOn,
              managerName: item.managerName,
              userName: item.userName,
            };
            if (
              this.approvalList.find(
                (x) =>
                  x.regulatoryAuthorityReferenceCode ==
                    item.regulatoryAuthorityReferenceCode &&
                  x.approveStatus == 'Approved'
              )
            ) {
              this.notifier.notify(
                'error',
                'Already' + ' ' + item.concernedMinistryName + ' ' + 'Is Approved'
              );
            }
            sourceForward.push(
              this.concernedMinistryAuthService.submitConcernedMinistriesApprove(model)
            );
          }
        });
        if (sourceForward.length > 0) {
          this.concernedMinistryAuthService
            .multipleAPIRequests(sourceForward)
            .subscribe((result) => {
              console.log(result);
              this.reloaddata.emit();
            });
        }
        this.closeApproveConcernedMinistry();
  }
  closeApproveConcernedMinistry() {
    (this.activeModal ?? this.modal)?.dismiss?.('dismissed');
    this.reloaddata.emit();
  }
  getPendingConcernedMinistryApprovalsList() {
    var id = this.persistence.getUserId() ?? 0;
    this.concernedMinistryAuthService
      .getAllPendingConcernedMinistry(id)
      .subscribe({
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
  
  getAllPendingConcernedMinistryMappingList() {
    var id = this.persistence.getUserId() ?? 0;
    this.concernedMinistryAuthService.getAllPendingConcernedMinistryMapping(id).subscribe({
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

}
