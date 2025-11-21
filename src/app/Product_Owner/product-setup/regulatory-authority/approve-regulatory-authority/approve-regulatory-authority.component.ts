import {
  Component,
  EventEmitter,
  Input,
  Optional,
  Output,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { auto } from '@popperjs/core';
import { GridApi } from 'ag-grid-community';
import { NotifierService } from 'angular-notifier';
import { id } from 'date-fns/locale';
import { Observable } from 'rxjs';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { RefApprovalStatus } from 'src/app/enums/enums';
import { accessModel } from 'src/app/Models/pendingapproval';
import {
  CountryRegulatoryAuthorityMapping,
  PostRegulatoryAuthorities,
} from 'src/app/Models/postRegulatoryAuthorities';
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
  selector: 'app-approve-regulatory-authority',
  templateUrl: './approve-regulatory-authority.component.html',
  styleUrls: ['./approve-regulatory-authority.component.scss'],
})
export class ApproveRegulatoryAuthorityComponent {
  approvalRegAuthMappingCount: number = 0;

  public rowSelection: 'single' | 'multiple' = 'multiple';
  active = 1;
  @Input()
  modal: any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();
  insertionEntityTypeApprovalCount: string = '.';
  approvalEntityTypeMappingCount: string = '.';
  private gridApi: GridApi | undefined;
  defaultColumnDef: typeof defaultColumnDef = defaultColumnDef;
  rowData: any[] = [];
  approvalList: any[] = [];
  mappingList: any[] = [];
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
      headerName: 'Regulatory Authority',
      field: 'regulatoryAuthorityName',
      flex: 1,
    },
    {
      headerName: 'Regulatory Authority Code',
      field: 'regulatoryAuthorityCode',
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

  // country regAuth Mapping
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

    { headerName: 'Regulatory Authority', field: 'regAuthName', flex: 1 },

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
  persistanceService: PersistenceService;

  // Coutnry EntityType Mapping End

  constructor(
    private regulatoryAuthService: RegulatoryAuthorityService,
    private persistance: PersistenceService,
    private notifier: NotifierService,
    @Optional() public activeModal: NgbActiveModal
  ) {
    this.persistanceService = this.persistance;
  }
  onGridReady(params: any): void {
    this.gridApi = params.api;
  }

  ngOnInit(): void {
    this.getRegAuthMappingApprovalsList();
    this.getAllApprovalsList();
    this.getApprovalsList();
    this.getAllRegAuthMappingApprovalsList();
  }
  getApprovalsList() {
    var id = this.persistance.getUserId() ?? 0;
    this.regulatoryAuthService.getAllPendingRegAuth(id).subscribe({
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

  getAllApprovalsList() {
    this.regulatoryAuthService.getAllRegulatoryAuthorities().subscribe({
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
  //   var selectedRows = this.gridApi?.getSelectedRows();
  //   selectedRows?.forEach((item) => {
  //     if (item.status == "Pending" && item.createdBy != this.persistance.getUserId()) {
  //       var model: accessModel = {
  //         managerId: this.persistance.getManagerId(),
  //         createdBy: this.persistance.getUserId()!,
  //         uid: item.uid
  //       };
  //       if (this.approvalList.find(x => x.entityType == item.entityType && x.status == "Approved")) {
  //         this.notifier.notify("error", "Already" + ' ' + item.entityType + ' ' + "Is Approved");
  //       }
  //       model.entityTypeId = item.entityTypeId;
  //       sourece.push(this.entityTypeService.submitEntityTypeForward(model));

  //     }
  //   });
  //   if (sourece.length > 0) {
  //     this.entityTypeService.multipleAPIRequests(sourece).subscribe((result) => {

  //       console.log(result);
  //       this.reloaddata.emit();
  //     })
  //   }
  //   this.closeApproveEntityType();

  // }

  // acceptSelectedRequests() {
  //   var sourece: Observable<any>[] = [];
  //   var selectedRows = this.gridApi?.getSelectedRows();
  //   selectedRows?.forEach((item) => {
  //     if (item.status == "Pending" && item.createdBy != this.persistance.getUserId()) {
  //       var model: accessModel = {
  //         managerId: this.persistance.getManagerId(),
  //         createdBy: this.persistance.getUserId()!,
  //         uid: item.uid
  //       };
  //       if (this.approvalList.find(x => x.entityType == item.entityType && x.status == "Approved")) {
  //         this.notifier.notify("error", "Already" + ' ' + item.entityType + ' ' + "Is Approved");
  //       }
  //       model.entityTypeId = item.entityTypeId;
  //       sourece.push(this.entityTypeService.submitEntityTypeApprove(model));

  //     }
  //   });
  //   if (sourece.length > 0) {
  //     this.entityTypeService.multipleAPIRequests(sourece).subscribe((result) => {

  //       console.log(result);
  //       this.reloaddata.emit();
  //     })
  //   }
  //   this.closeApproveRegAuth();

  // }

  // rejectSelectedRequests() {
  //   var sourece: Observable<any>[] = [];
  //   var selectedRows = this.gridApi?.getSelectedRows();
  //   selectedRows?.forEach((item) => {
  //     if (item.status == "Pending" && item.createdBy != this.persistance.getUserId()) {
  //       var model: accessModel = {
  //         managerId: this.persistance.getManagerId(),
  //         createdBy: this.persistance.getUserId()!,

  //         uid: item.uid
  //       };

  //       model.entityTypeId = item.entityTypeId;
  //       sourece.push(this.entityTypeService.submitEntityTypeReject(model));

  //     }
  //   });
  //   if (sourece.length > 0) {
  //     this.entityTypeService.multipleAPIRequests(sourece).subscribe((result) => {

  //       console.log(result);
  //       this.reloaddata.emit();
  //     })
  //   }
  //   this.closeApproveRegAuth();

  // }

  // Coutnry EntityType Mapping

  onMappingGridReady(params: any): void {
    this.mappingGridApi = params.api;
  }

  getRegAuthMappingApprovalsList() {
    var id = this.persistance.getUserId() ?? 0;
    this.regulatoryAuthService.getAllPendingRegAuthMapping(id).subscribe({
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

  getAllRegAuthMappingApprovalsList() {
    this.regulatoryAuthService.getAllRegAuthMapping().subscribe({
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
  acceptSelectedRegAuthRequests() {
    var sourece: Observable<any>[] = [];
    var selectedInsertionRegAuthRows = this.gridApi?.getSelectedRows();
    selectedInsertionRegAuthRows?.forEach((item) => {
      if (
        item.approveStatus == 'Pending' &&
        item.createdBy != this.persistance.getUserId()
      ) {
        var model: PostRegulatoryAuthorities = {
          managerId: this.persistance.getManagerId() ?? 0,
          ModifiedBy: this.persistance.getUserId()! ?? 0,
          createdBy: item.createdBy,
          uid: item.uid,
          id: item.id,
          approveStatus: RefApprovalStatus.Approved.toString(),
          regulatoryAuthorityName: item.regulatoryAuthorityName,
          regulatoryAuthorityCode: item.regulatoryAuthorityCode,
          regulatoryAuthorityReferenceCode:
            item.regulatoryAuthorityReferenceCode,
          status: 1,
          CreatedOn: item.CreatedOn,
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
            'Already' + ' ' + item.regulatoryAuthorityName + ' ' + 'Is Approved'
          );
        }
        sourece.push(
          this.regulatoryAuthService.submitRegulatoryAuthoritiesApprove(model)
        );
      }
    });
    if (sourece.length > 0) {
      this.regulatoryAuthService
        .multipleAPIRequests(sourece)
        .subscribe((result) => {
          console.log(result);
          this.reloaddata.emit();
        });
    }
    this.closeApproveRegAuth();
  }

  forwardSelectedRegAuthRequest() {
    var sourece: Observable<any>[] = [];
    var selectedRows = this.gridApi?.getSelectedRows();
    selectedRows?.forEach((item) => {
      if (
        item.approveStatus == 'Pending' &&
        item.createdBy != this.persistance.getUserId()
      ) {
        var model: PostRegulatoryAuthorities = {
          managerId: this.persistance.getManagerId() ?? 0,
          ModifiedBy: this.persistance.getUserId()! ?? 0,
          createdBy: item.createdBy,
          uid: item.uid,
          id: item.id,
          approveStatus: RefApprovalStatus.Forward.toString(),
          regulatoryAuthorityName: item.regulatoryAuthorityName,
          regulatoryAuthorityCode: item.regulatoryAuthorityCode,
          regulatoryAuthorityReferenceCode:
            item.regulatoryAuthorityReferenceCode,
          status: 1,
          CreatedOn: item.CreatedOn,
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
            'Already' + ' ' + item.regulatoryAuthorityName + ' ' + 'Is Approved'
          );
        }
        sourece.push(
          this.regulatoryAuthService.submitRegulatoryAuthoritiesApprove(model)
        );
      }
    });
    if (sourece.length > 0) {
      this.regulatoryAuthService
        .multipleAPIRequests(sourece)
        .subscribe((result) => {
          console.log(result);
          this.reloaddata.emit();
        });
    }
    this.closeApproveRegAuth();
  }

  rejectSelectedRegAuthRequests() {
    var sourece: Observable<any>[] = [];
    var selectedRows = this.gridApi?.getSelectedRows();
    selectedRows?.forEach((item) => {
      if (
        item.approveStatus == 'Pending' &&
        item.createdBy != this.persistance.getUserId()
      ) {
        var model: PostRegulatoryAuthorities = {
          managerId: this.persistance.getManagerId() ?? 0,
          ModifiedBy: this.persistance.getUserId()! ?? 0,
          createdBy: item.createdBy,
          uid: item.uid,
          id: item.id,
          approveStatus: RefApprovalStatus.Rejected.toString(),
          regulatoryAuthorityName: item.regulatoryAuthorityName,
          regulatoryAuthorityCode: item.regulatoryAuthorityCode,
          regulatoryAuthorityReferenceCode:
            item.regulatoryAuthorityReferenceCode,
          status: 1,
          CreatedOn: item.CreatedOn,
          managerName: item.managerName,
          userName: item.userName,
        };
        sourece.push(
          this.regulatoryAuthService.submitRegulatoryAuthoritiesApprove(model)
        );
      }
    });
    if (sourece.length > 0) {
      this.regulatoryAuthService
        .multipleAPIRequests(sourece)
        .subscribe((result: any) => {
          this.notifier.notify('success', result.message);
          this.reloaddata.emit();
        });
    }
    this.closeApproveRegAuth();
  }
  onFilterTextBoxChanged(event: any) {
    this.gridApi!.setQuickFilter(event.target.value);
  }
  closeApproveRegAuth() {
    (this.activeModal ?? this.modal)?.dismiss?.('dismissed');
    this.reloaddata.emit();
  }

  onFilterCountryRegAuthMappingChanged(event: any) {
    this.mappingGridApi!.setQuickFilter(event.target.value);
  }

  acceptSelectedRegAuthMappingRequests() {
    var sourece: Observable<any>[] = [];
    var selectedInsertionRegAuthRows = this.mappingGridApi?.getSelectedRows();
    selectedInsertionRegAuthRows?.forEach((item) => {
      if (
        item.approveStatus == 'Pending' &&
        item.createdBy != this.persistance.getUserId()
      ) {
        var model: CountryRegulatoryAuthorityMapping = {
          managerId: this.persistance.getManagerId() ?? 0,
          modifiedBy: this.persistance.getUserId()! ?? 0,
          createdBy: item.createdBy,
          uid: item.uid,
          id: item.id,
          approveStatus: RefApprovalStatus.Approved.toString(),
          regAuthName: item.regulatoryAuthorityName,
          regulatoryAuthorityId: item.regulatoryAuthorityId,
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
            'Already' + ' ' + item.regAuthName + ' ' + 'Is Approved'
          );
        }
        sourece.push(
          this.regulatoryAuthService.submitRegulatoryAuthoritiesMappingApprove(
            model
          )
        );
      }
    });
    if (sourece.length > 0) {
      this.regulatoryAuthService
        .multipleAPIRequests(sourece)
        .subscribe((result) => {
          this.notifier.notify(
            'success',
            'Selected Regulatory Authority Mapping Requests are Approved'
          );
          console.log(result);
          this.reloaddata.emit();
        });
    }
    this.closeApproveRegAuth();
  }

   rejectSelectedRegAuthMappingRequests() {
    var sourece: Observable<any>[] = [];
    var selectedInsertionRegAuthRows = this.mappingGridApi?.getSelectedRows();
    selectedInsertionRegAuthRows?.forEach((item) => {
      if (
        item.approveStatus == 'Pending' &&
        item.createdBy != this.persistance.getUserId()
      ) {
        var model: CountryRegulatoryAuthorityMapping = {
          managerId: this.persistance.getManagerId() ?? 0,
          modifiedBy: this.persistance.getUserId()! ?? 0,
          createdBy: item.createdBy,
          uid: item.uid,
          id: item.id,
          approveStatus: RefApprovalStatus.Rejected.toString(),
          regAuthName: item.regulatoryAuthorityName,
          regulatoryAuthorityId: item.regulatoryAuthorityId,
          countryId: item.countryId,
          countryName: item.countryName,
          status: 1,
          createdOn: item.CreatedOn,
          managerName: item.managerName,
          userName: item.userName,
        };
 sourece.push(
          this.regulatoryAuthService.submitRegulatoryAuthoritiesMappingApprove(model)
        );
      }
    });
    if (sourece.length > 0) {
      this.regulatoryAuthService
        .multipleAPIRequests(sourece)
        .subscribe((result: any) => {
          this.notifier.notify('success', result[0].message?? 'Reg Auth Mapping rejected successfully.');
          this.reloaddata.emit();
        });
    }
    this.closeApproveRegAuth();
  }
  	forwardSelectedMappingRegAuthRequest() {
		var sourece: Observable<any>[] = [];
		var selectedRows = this.mappingGridApi?.getSelectedRows();
		selectedRows?.forEach((item) => {

			if (item.status == "Pending" && item.createdBy != this.persistance.getUserId()) {
				var model: CountryRegulatoryAuthorityMapping = {
					 managerId: this.persistance.getManagerId() ?? 0,
          modifiedBy: this.persistance.getUserId()! ?? 0,
          createdBy: item.createdBy,
          uid: item.uid,
          id: item.id,
          approveStatus: RefApprovalStatus.Forward.toString(),
          regAuthName: item.regulatoryAuthorityName,
          regulatoryAuthorityId: item.regulatoryAuthorityId,
          countryId: item.countryId,
          countryName: item.countryName,
          status: 1,
          createdOn: item.CreatedOn,
          managerName: item.managerName,
          userName: item.userName,
				};
				if (this.mappingList.find(x => x.entityType == item.entityType && x.countryName == item.countryName && x.status == "Approved")) {
					this.notifier.notify("error", "Already" + ' ' + item.countryName + item.entityType + ' ' + "Is Approved");
				}
				sourece.push(this.regulatoryAuthService.submitRegulatoryAuthoritiesMappingApprove(model));
			}
		});
		if (sourece.length > 0) {
			this.regulatoryAuthService.multipleAPIRequests(sourece).subscribe((result) => {

				console.log(result);
				this.reloaddata.emit();
			})
		}
		this.closeApproveRegAuth();
	}

}
