import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GridApi, Optional } from 'ag-grid-community';
import { NotifierService } from 'angular-notifier';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { UserRole } from 'src/app/enums/enums';
import { AnnoucementModel } from 'src/app/Models/annoucementModel';
import { accessModel } from 'src/app/Models/pendingapproval';
import { AnnouncementService } from 'src/app/Services/announcement.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { AddAnnouncementsComponent } from '../add-announcements/add-announcements.component';
const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
}
@Component({
  selector: 'app-announcement-approval',
  templateUrl: './announcement-approval.component.html',
  styleUrls: ['./announcement-approval.component.scss']
})
export class AnnouncementApprovalComponent {
  public rowSelection: 'single' | 'multiple' = 'multiple';
  @Input() active: number = 1;
  currentUserId = 0;
  roleName = "";
  descriptionMaxLength: number = 150;

  @Input()
  modal: any;

  @Input()
  approverUID: any ;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public sendSelectedUID: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  openannouncementReview: EventEmitter<any> = new EventEmitter<any>()

  announcement: AnnoucementModel | undefined | null;

  private gridApi: GridApi | undefined;
  defaultColumnDef = defaultColumnDef;
  persistanceService: PersistenceService | undefined;
  rowData: any[] = [];

  // Custom cell renderer for description column - defined before columnDefs
  descriptionCellRenderer = (params: any) => {
    const description = params.value;
    if (!description || typeof description !== 'string') return '';
    
    if (description.length <= this.descriptionMaxLength) {
      return `<span class="description-cell">${description}</span>`;
    }
    
    const truncated = description.substring(0, this.descriptionMaxLength) + '...';
    // Escape HTML and provide tooltip with full description
    const escapedDescription = description.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<span class="description-cell truncated" title="${escapedDescription}">${truncated}</span>`;
  }
  columnDefs = [
      { headerName: 'uid', field: 'approverUID', hide: true },
      { headerName: 'createdBy', field: 'createdBy', hide: true },
      {
        field: 'RowSelect',
        headerName: ' ',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        suppressMenu: true,
        suppressSorting: true,
        width: 40,
      },
      { headerName: 'Regulation Name', field: 'displayName', width: 150 },
      { headerName: 'Created Date', field: 'createdDate', width: 120 },
      { headerName: 'Applacable Date', field: 'applicableDate', width: 120 },
      { headerName: 'Description', field: 'description', width: 200,cellStyle: {
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap',
        'overflow': 'hidden',
        'padding': '1' 
      }},
      { headerName: 'Point of Contact', field: 'fullName', width: 150 },
      { headerName: 'Approved By', field: 'approvedBy', width: 150 },
      {
        headerName: 'Status', field: 'status', width: 105,
        cellRenderer: AgbuttonComponent,
        cellRendererParams: {
          clicked: (field: any) => {
            if (this.persistance.getUserId() != field.data!.createdBy) {
              // Open announcement in review mode when clicked on pending status
              this.openAnnouncementReview(field.data);
            }
          }
        },
      },
  
    ];

  constructor(private persistance: PersistenceService, private announcementService:AnnouncementService,@Optional() public activeModal: NgbActiveModal,private modalService: NgbModal,
    private notifier: NotifierService) {
    this.persistanceService = this.persistance;
  }  

  onGridReady(params: any): void {
    this.gridApi = params.api;
  }

  ngOnInit(): void {
    this.getAnouncementByUID();
    this.roleName = this.persistance.getRole()!;
  }

  submitApproved() {
    var model: accessModel = {
      managerId: this.persistance.getManagerId(),
      createdBy: this.persistance.getUserId()!,
      uid: this.rowData[0].approverUID!
    };
    if (this.persistance.getRole() == UserRole.Reviewer) {
      this.announcementService.submitReviewed(model).subscribe((result: any) => {
        if (result) {
          this.notifier.notify("success", result.responseMessage);
        }
        else {
          this.notifier.notify("error", result.responseMessage);
        }

      });
    }
    else {
      this.announcementService.submitApproved(model).subscribe((result: any) => {
        if (result) {
          this.notifier.notify("success", result.responseMessage);
        }
        else {
          this.notifier.notify("error", result.responseMessage);
        }

      });
    }
  }

  submitReject() {
    var model: accessModel = {
      managerId: this.persistance.getManagerId(),
      createdBy: this.persistance.getUserId()!,
      uid: this.approverUID!
    };

    this.announcementService.submitReject(model).subscribe((result: any) => {

      if (result) {
        this.notifier.notify("success", result.responseMessage);
      }
      else {
        this.notifier.notify("error", result.responseMessage);
      }
    });
  }

  getAnouncementByUID() {
    var uid = this.persistance.getUserUID();
    this.announcementService.GetPendingAnnouncementApproval(uid).subscribe({
      next: (result: any) => {
        this.rowData = result;
        console.log('Pending announcements loaded:', result);
        // Log the structure of each announcement to understand available data
        if (result && result.length > 0) {
          result.forEach((announcement: any, index: number) => {
            console.log(`Announcement ${index}:`, {
              approverUID: announcement.approverUID,
              regulationId: announcement.regulationId,
              complianceId: announcement.complianceId || announcement.ComplianceId || announcement.complainceId,
              tocId: announcement.tocId || announcement.TOCId || announcement.typeOfComplianceId,
              registerId: announcement.registerId || announcement.RegisterId || announcement.registerationId,
              subject: announcement.subject,
              description: announcement.description,
              regulationName: announcement.regulationName,
              complianceName: announcement.complianceName,
              typeOfComplianceName: announcement.typeOfComplianceName
            });
          });
        }
      },
      error: (error: any) => {
        console.log(error);
      }
    })
  }

  onFilterTextBoxChanged(event: any) {
   this.gridApi!.setQuickFilter(event.target.value);
  }

  closeAnnouncementApproval() {
   (this.activeModal ?? this.modal)?.dismiss?.('dismissed');
  }

  // Method to open announcement in pending review mode
  openAnnouncementReview(announcementData: any) {
    console.log('Opening announcement review for:', announcementData);
    
    const modelRef = this.modalService.open(AddAnnouncementsComponent, {
      size: 'xl',
      centered: true,
    });
    
    // Set the component to pending mode
    modelRef.componentInstance.isPendingMode = true;
    modelRef.componentInstance.ActionType = "Approve";
    modelRef.componentInstance.RegulationSetupUID = announcementData.approverUID;
    
    // Pass the approval data to preserve displayName and other details
    modelRef.componentInstance.approvalData = announcementData;
    // Determine selection type based on the announcement data
    // Check for different ID types to determine which dropdown should be shown
    const registerIdValue = announcementData.registerId || announcementData.RegisterId || announcementData.registerationId;
    const tocIdValue = announcementData.tocId || announcementData.TOCId || announcementData.typeOfComplianceId;
    const complianceIdValue = announcementData.complianceId || announcementData.ComplianceId || announcementData.complainceId;
    const regulationIdValue = announcementData.regulationId || announcementData.RegulationId;
    
    let selectionType = 'regulation'; // Default
    
    console.log('Announcement data analysis:', {
      registerId: registerIdValue,
      tocId: tocIdValue, 
      complianceId: complianceIdValue,
      regulationId: regulationIdValue
    });
    
    // Determine selection type (priority: registration > toc > compliance > regulation)
    if (registerIdValue && registerIdValue !== null && registerIdValue !== 0) {
      selectionType = 'registration';
      console.log('Detected registration announcement with registerId:', registerIdValue);
    } else if (tocIdValue && tocIdValue !== null && tocIdValue !== 0) {
      selectionType = 'toc';
      console.log('Detected TOC announcement with tocId:', tocIdValue);
    } else if (complianceIdValue && complianceIdValue !== null && complianceIdValue !== 0) {
      selectionType = 'compliance';
      console.log('Detected compliance announcement with complianceId:', complianceIdValue);
    } else if (regulationIdValue && regulationIdValue !== null && regulationIdValue !== 0) {
      selectionType = 'regulation';
      console.log('Detected regulation announcement with regulationId:', regulationIdValue);
    }
    
    // Set the selection type so the correct dropdown is shown
    modelRef.componentInstance.selectionType = selectionType;
    console.log('Set selectionType to:', selectionType, 'for pending approval');
    
    // Pass specific ID values for preselection
    if (selectionType === 'registration' && registerIdValue) {
      modelRef.componentInstance.selectedRegistrationId = registerIdValue;
      console.log('Set selectedRegistrationId:', registerIdValue);
    } else if (selectionType === 'toc' && tocIdValue) {
      modelRef.componentInstance.selectedTocId = tocIdValue;
      console.log('Set selectedTocId:', tocIdValue);
      
      // Pass the displayName from approval data as selectedTocType for proper matching
      if (announcementData.displayName) {
        modelRef.componentInstance.selectedTocType = announcementData.displayName;
        console.log('Set selectedTocType from displayName:', announcementData.displayName);
      }
    }
    
    // Subscribe to reload event
    modelRef.componentInstance.reloaddata.subscribe((event: any) => {
      if (event === 'approved' || event === 'rejected') {
        this.getAnouncementByUID(); // Reload the pending announcements list
      }
    });
  }

  // Method to get truncated description for ag-grid cell renderer
  getTruncatedDescription(description: string | undefined): string {
    if (!description) return '';
    if (description.length <= this.descriptionMaxLength) return description;
    return description.substring(0, this.descriptionMaxLength) + '...';
  }

  // Method to check if description needs truncation
  shouldShowSeeMore(description: string | undefined): boolean {
    if (!description) return false;
    return description.length > this.descriptionMaxLength;
  }

}
