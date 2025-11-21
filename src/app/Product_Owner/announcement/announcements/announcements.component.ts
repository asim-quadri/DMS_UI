import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid-community';
import { NotifierService } from 'angular-notifier';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { AnnoucementModel } from 'src/app/Models/annoucementModel';
import { pendingApproval } from 'src/app/Models/pendingapproval';
import {
  ComplianceListModle,
  RegulationSetupDetailsModel,
  ReuglationListModle,
  TOCListModel,
} from 'src/app/Models/regulationsetupModel';
import { MenuOptionModel, UsersModel } from 'src/app/Models/Users';
import { AnnouncementService } from 'src/app/Services/announcement.service';
import { CountryService } from 'src/app/Services/country.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { CompliancetrackerService } from 'src/app/Services/compliancetracker.service';
import { AnnouncementApprovalComponent } from '../announcement-approval/announcement-approval.component';
import { AddAnnouncementsComponent } from '../add-announcements/add-announcements.component';

const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
};

@Component({
  selector: 'app-announcements',
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.scss'],
})
export class AnnouncementsComponent implements OnInit {
  contextMenuPosition = { x: '0px', y: '0px' };
  showContextMenu = false;
  contextMenuTarget: any;

  expandedRegulations = new Set<number>();
  expandedCompliances = new Set<number>();
  expandedRegulationSetup = new Set<number>();
  regulationSetup: ReuglationListModle[] = [];
  compliances: any[] = [];
  selectionType: 'regulation' | 'compliance' | 'toc' | 'registration' = 'regulation';
  selectedId:number | null = null;
  announcements: AnnoucementModel[] = [];
  descriptionMaxLength: number = 150;
  tocId: any; // Add property to track TOC ID
  selectedTocType: string = ''; // Add property to track TOC type (payment, filing, etc.)
  registrations: any[] = []; // Add property to store registration data
  selectedRegistrationId: any; // Add property to track selected registration ID
  tocDues: any[] = []; // Add property to store TOC dues data
  currentAnnouncementForEdit: AnnoucementModel | null = null; // Add property to store announcement being edited 

  @ViewChild('addRegulationSetupApporoval') addRegulationSetupApporoval: any;
  pendingApproval: pendingApproval | undefined;

  active = 7;
  disabled = true;
  showDiv: boolean = false;
  closeResult = '';
  defaultColumnDef = defaultColumnDef;
  private api: GridApi | undefined;
  announcementCount: string = '.';
  columnDefs = [
    { headerName: 'id', field: 'id', hide: true },
    { headerName: 'uid', field: 'uid', hide: true },
    { headerName: 'RegulationName', field: 'fullName', width: 150 },
    { headerName: 'RegulationType', field: 'email', width: 210 },
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
            this.regulationSetupModel = { ...field.data };
            this.pendingApproval = { userUID: this.regulationSetupModel.uid! };
          }
        },
      },
    },
  ];

  currentComponent = 'ragulation-setup';
  @ViewChild('RegComplianceReview') RegComplianceReview: any;
  @ViewChild('TOCRegistration') TOCRegistration: any;
  @ViewChild('TOCRules') TOCRules: any;
  @ViewChild('RegulationSetupReview') RegulationSetupReview: any;
  RegComplianceUID: any;

  RegTOC: TOCListModel | undefined;

  tocRegistrationHistory: any;
  tocRulesHistory: any;

  complianceId: any;
  complianceName: any;
  regulationId: any | undefined;
  approverUID: any;

  regulationSetupName: any;
  majorIndustryId: any;
  isParameterChecked: any;

  regulationSetupModel: RegulationSetupDetailsModel = {};

  regulationSetupUID: any | undefined;

  regulationSetupScreen: boolean = true;
  showAddNewRegulation: boolean = false;
  showApprovalButton: boolean = false;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  ActionType = 'Edit';

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private notifier: NotifierService,
    public regulationSetupService: RegulationSetupService,
    public countryService: CountryService,
    private persistance: PersistenceService,
    private announcementService: AnnouncementService,
    private compliancetrackerService: CompliancetrackerService,
    private elementRef: ElementRef
  ) {
    //this.ShowCompliance();
    //this.ShowTOC();
    this.ShowRegulationSetup();
  }

  formgroup: FormGroup = this.fb.group({
    createdDate: ['', Validators.required],
    applicableDate: ['', Validators.required],
    description: ['', Validators.required],
    createdBy: ['', Validators.required],
  });

  ngOnInit() {
    this.loadAllAnnouncements();
    this.getHistoryRegulationSetup();

    var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 14
      var menuOptions = roleMenuOptions.filter(
        (option: MenuOptionModel) => option.parentId === 14
      );
      if (menuOptions.length > 0) {
        this.showAddNewRegulation =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'Add New Annoucement' && option.canView
          ).length > 0;
        this.showApprovalButton =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'APPROVALS' && option.canView
          ).length > 0;
      }
    }
  }

  onMenuRightClick(
    event: MouseEvent,
    item: any,
    regulation: ReuglationListModle
  ): boolean {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenuTarget = item;
    this.showContextMenu = true;
    if (item.ruleType == 'Compliance') {
      this.complianceId = this.contextMenuTarget.id;
      this.complianceName = this.contextMenuTarget.complianceName;
      this.regulationId = null;
      this.regulationSetupName = null;
      this.majorIndustryId = regulation.majorIndustryId;
    } else if (item.ruleType == 'Regulation') {
      this.complianceId = null;
      this.complianceName = null;
      this.regulationId = this.contextMenuTarget.id;
      this.regulationSetupName = this.contextMenuTarget.regulationName;
      this.isParameterChecked = this.contextMenuTarget.isParameterChecked;
      this.majorIndustryId = regulation.majorIndustryId;
    }
    this.regulationSetupUID = regulation.regulationSetupUID;
    this.isParameterChecked = regulation.isParameterChecked;
    this.ActionType = 'Create';

    return false;
  }

  onMenuItemClick(action: string) {
    this.currentComponent = '';
    if (action == 'Compliance') {
      setTimeout(() => {
        this.ShowCompliance();
      }, 500);
    } else if (action == 'Type of Compliance') {
      setTimeout(() => {
        this.ShowTOC();
      }, 500);
    } else if (action == 'RegulationSetup') {
      setTimeout(() => {
        this.ShowRegulationSetup();
      }, 500);
    }
    this.ActionType = 'Create';
    this.showContextMenu = false;
    // Perform the desired action based on the clicked menu item
  }

  toggleRegulationRedirect(regulationId: any) {
    this.currentComponent = '';
    if (this.expandedRegulations.has(regulationId!)) {
      this.expandedRegulations.delete(regulationId!);
    } else {
      this.expandedRegulations.add(regulationId!);
    }
    // this.regulationId = regulationId;
    this.regulationSetupUID = null;
    this.ActionType = 'Create';
    
    this.compliancetrackerService.getAllCompliances().subscribe({
      next: (result: any) => {
        this.compliances = result || [];
          this.ShowRegulationSetup();
          var modelRef = this.modalService.open(AddAnnouncementsComponent, {
            size: 'xl',
            centered: true,
          });
    modelRef.componentInstance.ActionType=this.ActionType;
    
    // Pass the correct data based on selection type
    if (this.selectionType === 'compliance') {
      this.regulationId=this.complianceId;
      modelRef.componentInstance.complianceId = this.complianceId;
      modelRef.componentInstance.RegulationId = this.complianceId; // Use complianceId for RegulationId field in compliance mode
    } else if (this.selectionType === 'registration') {
      this.regulationId=this.tocId;
      modelRef.componentInstance.tocId = this.tocId;
      modelRef.componentInstance.RegulationId = this.tocId; // Use tocId for RegulationId field in registration mode
      // Pass registration data for dropdown with preselected value
      modelRef.componentInstance.registrations = this.registrations;
      modelRef.componentInstance.selectedRegistrationId = this.selectedRegistrationId;
    } else if (this.selectionType === 'toc') {
       this.regulationId=this.tocId;
      modelRef.componentInstance.tocId = this.tocId;
      modelRef.componentInstance.RegulationId = this.tocId; // Use tocId for RegulationId field in TOC mode
      // Pass TOC dues data for payment/filing TOC types
      if (this.selectedTocType && (this.selectedTocType.toLowerCase().includes('payment') || 
          this.selectedTocType.toLowerCase().includes('filing') || 
          this.selectedTocType.toLowerCase().includes('activity') || 
          this.selectedTocType.toLowerCase().includes('events'))) {
        modelRef.componentInstance.tocDues = this.tocDues;
        modelRef.componentInstance.selectedTocId = this.tocId; // Pass selected TOC ID for preselection
      }
    } else {
      modelRef.componentInstance.RegulationId = this.regulationId;
    }
    
    modelRef.componentInstance.selectionType = this.selectionType;
    modelRef.componentInstance.compliances = this.compliances;
    modelRef.componentInstance.RegulationSetupUID = this.regulationSetupUID;
    modelRef.componentInstance.selectedTocType = this.selectedTocType;
    
    // Subscribe to reload event
    modelRef.componentInstance.reloadPage.subscribe((event: any) => {
      if (event == 'reload') {
        this.loadAllAnnouncements(this.regulationId,this.selectionType);
       // this.getHistoryRegulationSetup();
      }
    });
      
      },
      error: (error: any) => {
        console.error('Error loading compliances for Add New:', error);
        this.compliances = [];
      },
    });
    
  }

  toggleRegulation(regulation: ReuglationListModle) {
    this.currentComponent = '';
    this.isParameterChecked = regulation.isParameterChecked;
    if (this.expandedRegulations.has(regulation.id!)) {
      this.expandedRegulations.delete(regulation.id!);
    } else {
      this.expandedRegulations.add(regulation.id!);
    }
    this.regulationId = regulation.id;
    this.majorIndustryId = regulation.majorIndustryId;

    this.regulationSetupUID = regulation.id;
    this.ActionType = 'Edit';
    this.selectionType = 'regulation'; // Set selection type to regulation

    // Load announcements for this specific regulation
    this.loadAllAnnouncements(regulation.id, 'regulation');

    // Call getAllCompliances for regulation click
    this.compliancetrackerService.getAllCompliances().subscribe({
      next: (result: any) => {
        this.compliances = result || [];
        setTimeout(() => {
          this.ShowRegulationSetup();
        });
      },
      error: (error: any) => {
        console.error('Error loading compliances:', error);
        this.compliances = [];
      },
    });

  }

  toggleCompliance(
    compliance: ComplianceListModle,
    regulation: ReuglationListModle
  ) {
    this.currentComponent = '';
    if (this.expandedCompliances.has(compliance.id!)) {
      this.expandedCompliances.delete(compliance.id!);
    } else {
      this.expandedCompliances.add(compliance.id!);
    }
    this.complianceId = compliance.id;
    this.regulationId = regulation.id;
    this.RegComplianceUID = compliance.complianceUID!;
    this.ActionType = 'Edit';
    this.selectionType = 'compliance'; 
    this.isParameterChecked = regulation.isParameterChecked;
    this.regulationSetupUID = regulation.regulationSetupUID;

    this.loadAllAnnouncements(compliance.id, 'compliance');

    this.compliancetrackerService.getAllCompliances().subscribe({
      next: (result: any) => {
        
          this.ShowRegulationSetup(); 
      },
      error: (error: any) => {
        console.error('Error loading compliances for compliance click:', error);
        this.compliances = [];
          this.ShowRegulationSetup(); 
        
      },
    });
  }

  toggleTocUnderCompliance(
    compliance: ComplianceListModle,
    toc: TOCListModel,
    regulation: ReuglationListModle
  ) {
    this.currentComponent = '';
    this.complianceId = compliance.id;
    this.regulationId = 0;
    this.RegTOC = toc!;
    this.ActionType = 'Edit';
    this.isParameterChecked = regulation.isParameterChecked;
    this.regulationSetupUID = regulation.regulationSetupUID;
    this.tocId = toc?.id || toc?.typeOfComplianceId || null;
    this.selectedTocType = toc?.ruleType || toc?.typeOfComplianceName || '';
    if (this.selectedTocType && this.selectedTocType.toLowerCase().includes('registration')) {
      this.selectionType = 'registration';
      this.selectedRegistrationId = toc?.id;
      this.tocId = toc?.id; 

      this.loadRegistrationsFromHistory(); 
 
        const foundReg = this.registrations.find(reg => reg.id === this.selectedRegistrationId);
        if (!foundReg && toc) {
          const manualReg = {
            id: toc.id,
            typeOfComplianceId: toc.typeOfComplianceId,
            typeOfComplianceName: toc.typeOfComplianceName,
            ruleType: toc.ruleType,
            regulationId: regulation.id,
            regulationName: regulation.regulationName,
            complianceId: compliance.id,
            complianceName: compliance.complianceName,
            registrationName: `${toc.typeOfComplianceName} - ${compliance.complianceName}`,
            displayName: `${toc.typeOfComplianceName} - ${compliance.complianceName}`,
            level: 'compliance'
          };
          this.registrations.unshift(manualReg);
        }
    } else if (this.selectedTocType && (this.selectedTocType.toLowerCase().includes('payment') || 
        this.selectedTocType.toLowerCase().includes('filing') || 
        this.selectedTocType.toLowerCase().includes('activity') || 
        this.selectedTocType.toLowerCase().includes('events'))) {
      this.selectionType = 'toc';
      this.selectedRegistrationId = null; // Reset registration selection
      this.loadTOCDuesFromHistory();
    } else {
      this.selectionType = 'toc';
      this.selectedRegistrationId = null;
    }

    // Load announcements for this specific TOC
    const ruleType = this.selectionType === 'registration' ? 'registration' : 'toc';
    this.loadAllAnnouncements(this.tocId, ruleType);

      this.ShowTOC();
  }

  toggleTocUnderRegulation(
    toc: TOCListModel,
    regulationsetup: ReuglationListModle
  ) {
    this.currentComponent = '';
    this.complianceId = 0;
    this.regulationId = regulationsetup.id;
    this.RegTOC = toc!;
    this.isParameterChecked = regulationsetup.isParameterChecked;
    this.regulationSetupUID = regulationsetup.regulationSetupUID;
    this.ActionType = 'Edit';
    this.tocId = toc?.id || toc?.typeOfComplianceId || null;
    this.selectedTocType = toc?.ruleType || toc?.typeOfComplianceName || '';    
    if (this.selectedTocType && this.selectedTocType.toLowerCase().includes('registration')) {
      this.selectionType = 'registration';
      this.selectedRegistrationId = toc?.id || this.tocId;
      
      this.loadRegistrationsFromHistory();
      
      setTimeout(() => {
        const foundReg = this.registrations.find(reg => reg.id === this.selectedRegistrationId);
        if (!foundReg && toc) {
          const manualReg = {
            id: toc.id,
            typeOfComplianceId: toc.typeOfComplianceId,
            typeOfComplianceName: toc.typeOfComplianceName,
            ruleType: toc.ruleType,
            regulationId: regulationsetup.id,
            regulationName: regulationsetup.regulationName,
            registrationName: `${toc.typeOfComplianceName} - ${regulationsetup.regulationName}`,
            displayName: `${toc.typeOfComplianceName} - ${regulationsetup.regulationName}`,
            level: 'regulation'
          };
          this.registrations.unshift(manualReg);
        }
      }, 100);
    } else if (this.selectedTocType && (this.selectedTocType.toLowerCase().includes('payment') || 
        this.selectedTocType.toLowerCase().includes('filing') || 
        this.selectedTocType.toLowerCase().includes('activity') || 
        this.selectedTocType.toLowerCase().includes('events'))) {
      this.selectionType = 'toc';
      this.selectedRegistrationId = null; // Reset registration selection
      this.loadTOCDuesFromHistory(); // Load TOC dues from history data
    } else {
      this.selectionType = 'toc';
      this.selectedRegistrationId = null;
    }

    // Load announcements for this specific TOC
    const ruleType = this.selectionType === 'registration' ? 'registration' : 'toc';
    this.loadAllAnnouncements(this.tocId, ruleType);

    setTimeout(() => {
      this.ShowTOC();
    }, 500);
  }

  isRegulationExpanded(regulationId: number): boolean {
    return this.expandedRegulations.has(regulationId);
  }

  isComplianceExpanded(complianceId: number): boolean {
    return this.expandedCompliances.has(complianceId);
  }

  // onSubmit() {
  //   if (this.formgroup.valid) {
  //     var annoucement: AnnoucementModel = { ...this.formgroup.value };
  //     annoucement.createdBy == this.persistance.getUserId();
  //     this.announcementService.addRegulationSetupDetails(annoucement).subscribe(
  //       (result: UsersModel) => {
  //         if (result.responseCode == 1) {
  //           this.notifier.notify('success', result.responseMessage);
  //           this.reloaddata.emit('reload');
  //           this.formgroup.reset();
  //         } else {
  //           this.notifier.notify('error', result.responseMessage);
  //         }
  //       },
  //       (error) => {
  //         this.notifier.notify('error', 'Some thing went wrong');
  //       }
  //     );
  //   }
  //   return;
  // }

  openAnnouncementApproverModal() {
    this.modalService.open(AnnouncementApprovalComponent, {
      size: 'xl',
      centered: true,
    });
  }

  openXl(content: any) {
    this.modalService.open(content, { size: 'xl', centered: true });
  }

  ShowCompliance() {
    this.currentComponent = 'Add-Compliance';
  }

  ShowTOC() {
    this.currentComponent = 'Add-TOC';
  }

  ShowRegulationSetup() {
    this.currentComponent = 'ragulation-setup';
  }

  reload(event: any) {
    this.modalService.dismissAll();
    this.getHistoryRegulationSetup();
    //this.getRegulationSetup();
  }

  getSelectedUId(event: any) {
    if (event.regulationType == 'Registration') {
      this.tocRegistrationHistory = event;
      this.openXl(this.TOCRegistration);
    } else if (
      event.regulationType == 'Payments' ||
      event.regulationType == 'Filing' ||
      event.regulationType == 'Activity' ||
      event.regulationType == 'Events'
    ) {
      this.tocRulesHistory = event;
      this.openXl(this.TOCRules);
    } else if (event.regulationType == 'Regulation Compliance') {
      this.approverUID = event.approverUID;
      this.openXl(this.RegComplianceReview);
    } else if (event.regulationType == 'Regulation Setup') {
      this.approverUID = event.approverUID;
      this.openXl(this.RegulationSetupReview);
    }
    // this.RegComplianceUID = event.approverUID;
  }

  getHistoryRegulationSetup() {
    this.regulationSetupService
      .getRegulationSetupHistory()
      .subscribe((result: ReuglationListModle[]) => {
        this.regulationSetup = result;

        this.regulationSetup.forEach((regulation) => {
          regulation.visible = true;
        });
        if (this.regulationSetup.length > 0)
          this.toggleRegulation(this.regulationSetup[0]!);
      });
  }

  searchRegulations(keyword: any) {
    this.searchRegulationswithKeyword(keyword.target.value);
  }

  clearSearch() {
    this.searchRegulationswithKeyword('');
  }

  searchRegulationswithKeyword(keyword: any) {
    const lowerKeyword = keyword.toLowerCase().trim();

    this.regulationSetup.forEach((reg) => {
      let match = false;

      // 1. Check regulation name
      if (reg.regulationName?.toLowerCase().includes(lowerKeyword)) {
        match = true;
      }

      // 2. Check TOC under regulation
      if (
        !match &&
        reg.toc?.some((t) =>
          t.typeOfComplianceName?.toLowerCase().includes(lowerKeyword)
        )
      ) {
        match = true;
      }

      // 3. Check compliance names and nested TOCs
      if (!match && reg.compliance) {
        for (let comp of reg.compliance) {
          if (comp.complianceName?.toLowerCase().includes(lowerKeyword)) {
            match = true;
            break;
          }

          if (
            comp.toc?.some((t) =>
              t.typeOfComplianceName?.toLowerCase().includes(lowerKeyword)
            )
          ) {
            match = true;
            break;
          }

          if (comp.compliance) {
            for (let child of comp.compliance) {
              if (child.complianceName?.toLowerCase().includes(lowerKeyword)) {
                match = true;
                break;
              }

              if (
                child.toc?.some((t) =>
                  t.typeOfComplianceName?.toLowerCase().includes(lowerKeyword)
                )
              ) {
                match = true;
                break;
              }
            }
          }
        }
      }

      reg.visible = match;
    });
  }

  searchAnnouncement(keyword: any) {
    this.searchAnnouncementwithKeyword(keyword.target.value);
  }
clearAnnouncementSearch()
{
  this.searchAnnouncementwithKeyword('');
}

  searchAnnouncementwithKeyword(keyword: any) {
    const lowerKeyword = keyword.toLowerCase().trim();

    this.announcements.forEach((annoucement) => {
      let match = true;

      // 1. Check regulation name
      if (annoucement.subject?.toLowerCase().includes(lowerKeyword)) {
        match = false;
      }
      annoucement.hide = match;
    });
  }


  loadAllAnnouncements(id?: any, ruleType?: string) {
    const targetId = id || this.persistance.getUserId();
    // Use the provided ruleType or fall back to the component's selectionType
    const effectiveRuleType = ruleType || this.selectionType;

    this.announcementService.getAllAnnouncements(targetId, effectiveRuleType).subscribe({
      next: (data: AnnoucementModel[]) => {
        // Ensure announcements is always an array
        this.announcements = (data || []).map((a: AnnoucementModel) => ({
          ...a,
          expanded: false,
        }));
      },
      error: (error: any) => {
        console.error('Error loading announcements:', error);
        this.notifier.notify('error', 'Failed to load announcements');
      },
    });
  }

  editAnnouncement(announcement: AnnoucementModel): void {

    if ((announcement as any).registerId || (announcement as any).RegisterId) {
      this.selectionType = 'registration';
      this.regulationId = (announcement as any).registerId || (announcement as any).RegisterId;
      this.selectedRegistrationId = (announcement as any).registerId || (announcement as any).RegisterId;
    } else if (announcement.tOCId || (announcement as any).tocId) {
      this.selectionType = 'toc';
       this.regulationId = announcement.tOCId || (announcement as any).tocId;
    } else if (announcement.complianceId) {
      this.selectionType = 'compliance'; 
      this.regulationId = announcement.complianceId;
    } else if (announcement.regulationId) {
      this.selectionType = 'regulation';
      this.regulationId = announcement.regulationId;
    } else {
      this.selectionType = 'regulation';
      this.regulationId = announcement.id;
    }

    this.ActionType = 'Edit';
    this.currentAnnouncementForEdit = announcement;
    if (this.selectionType === 'toc') {
     this.loadTocDuesForEdit();
    } else if (this.selectionType === 'registration') {
      this.loadRegistrationsForEdit();
    } else {
      this.loadCompliancesAndOpenModal(announcement);
    }
  }

  private loadCompliancesAndOpenModal(announcement: AnnoucementModel): void {
    this.compliancetrackerService.getAllCompliances().subscribe({
      next: (result: any) => {
        this.compliances = result || [];

        this.openEditModal(announcement);
      },
      error: (error: any) => {
        console.error('Error loading compliances for Edit:', error);
        this.compliances = [];
        // Open modal anyway with empty compliances
        this.openEditModal(announcement);
      },
    });
  }

  private loadTocDuesForEdit(): void {
    // Load TOC dues from the regulation setup service
    // this.regulationSetupService.getRegulationSetupDetails().subscribe({
    //   next: (regulations: any) => {
    //     // Find regulations that contain TOC data and enhance with display names
    //     this.tocDues = [];
    //     if (regulations && regulations.length > 0) {
    //       regulations.forEach((regulation: any) => {
    //         if (regulation.tocs && regulation.tocs.length > 0) {
    //           regulation.tocs.forEach((toc: any) => {
    //             // Only include TOC dues (payment, filing, activity, events) - not registrations
    //             if (toc.ruleType && (
    //               toc.ruleType.toLowerCase().includes('payment') ||
    //               toc.ruleType.toLowerCase().includes('filing') ||
    //               toc.ruleType.toLowerCase().includes('activity') ||
    //               toc.ruleType.toLowerCase().includes('events')
    //             )) {
    //               // Enhance TOC with display name: "RuleType - Regulation Name"
    //               const enhancedToc = {
    //                 ...toc,
    //                 regulationId: regulation.id,
    //                 regulationName: regulation.regulationName,
    //                 regulationSetupId: regulation.id,
    //                 tocRuleType: toc.ruleType,
    //                 displayName: `${toc.ruleType} - ${regulation.regulationName}`,
    //                 id: toc.id || toc.typeOfComplianceId
    //               };
    //               this.tocDues.push(enhancedToc);
    //             }
    //           });
    //         }
            
    //         // Also check compliance level for TOC dues
    //         if (regulation.compliance && regulation.compliance.length > 0) {
    //           regulation.compliance.forEach((compliance: any) => {
    //             if (compliance.toc && compliance.toc.length > 0) {
    //               compliance.toc.forEach((toc: any) => {
    //                 // Only include TOC dues (payment, filing, activity, events) - not registrations
    //                 if (toc.ruleType && (
    //                   toc.ruleType.toLowerCase().includes('payment') ||
    //                   toc.ruleType.toLowerCase().includes('filing') ||
    //                   toc.ruleType.toLowerCase().includes('activity') ||
    //                   toc.ruleType.toLowerCase().includes('events')
    //                 )) {
    //                   // Enhance TOC with display name: "RuleType - Compliance Name"
    //                   const enhancedToc = {
    //                     ...toc,
    //                     regulationId: regulation.id,
    //                     regulationName: regulation.regulationName,
    //                     complianceId: compliance.id,
    //                     complianceName: compliance.complianceName,
    //                     regulationSetupId: regulation.id,
    //                     tocRuleType: toc.ruleType,
    //                     displayName: `${toc.ruleType} - ${compliance.complianceName}`,
    //                     id: toc.id || toc.typeOfComplianceId
    //                   };
    //                   this.tocDues.push(enhancedToc);
    //                 }
    //               });
    //             }
    //           });
    //         }
    //       });
    //     }
   
    //   },
    //   error: (error: any) => {
    //     console.error('Error loading TOC dues for edit:', error);
    //     this.tocDues = [];
    //     if (this.currentAnnouncementForEdit) {
    //       this.loadCompliancesAndOpenModal(this.currentAnnouncementForEdit);
    //     }
    //   }
    // });
    this.loadTOCDuesFromHistory();
         if (this.currentAnnouncementForEdit) {
          this.loadCompliancesAndOpenModal(this.currentAnnouncementForEdit);
        }
  }

  private loadRegistrationsForEdit(): void {
    this.regulationSetupService.getRegulationSetupDetails().subscribe({
      next: (regulations: any) => {
        this.registrations = [];
        
        if (regulations && regulations.length > 0) {
          regulations.forEach((regulation: any) => {
            const regulationRegistrations = regulation.toc?.filter((toc: any) => 
              toc.ruleType && toc.ruleType.toLowerCase().includes('registration')
            ) || [];
            
            regulationRegistrations.forEach((regToc: any) => {
              const registrationItem = {
                id: regToc.id, // Use the toc.id for registrations outside compliance
                typeOfComplianceId: regToc.typeOfComplianceId,
                typeOfComplianceName: regToc.typeOfComplianceName,
                ruleType: regToc.ruleType,
                regulationId: regulation.id,
                regulationName: regulation.regulationName,
                registrationName: `${regToc.typeOfComplianceName} - ${regulation.regulationName}`,
                displayName: `Registration - ${regulation.regulationName}`,
                level: 'regulation' // Mark as regulation level
              };
              this.registrations.push(registrationItem);
            });
            
            // Also check compliance level for registration TOCs (inside compliance)
            if (regulation.compliance && regulation.compliance.length > 0) {
              regulation.compliance.forEach((compliance: any) => {
                const complianceRegistrations = compliance.toc?.filter((toc: any) => 
                  toc.ruleType && toc.ruleType.toLowerCase().includes('registration')
                ) || [];
                
                complianceRegistrations.forEach((regToc: any) => {
                  const registrationItem = {
                    id: regToc.id, // Use the toc.id for registrations inside compliance
                    typeOfComplianceId: regToc.typeOfComplianceId,
                    typeOfComplianceName: regToc.typeOfComplianceName,
                    ruleType: regToc.ruleType,
                    regulationId: regulation.id,
                    regulationName: regulation.regulationName,
                    complianceId: compliance.id,
                    complianceName: compliance.complianceName,
                    registrationName: `${regToc.typeOfComplianceName} - ${compliance.complianceName}`,
                    displayName: `Registration - ${compliance.complianceName}`,
                    level: 'compliance' // Mark as compliance level
                  };
                  this.registrations.push(registrationItem);
                });
              });
            }
          });
        }
        if (this.currentAnnouncementForEdit) {
          this.loadCompliancesAndOpenModal(this.currentAnnouncementForEdit);
        }
      },
      error: (error: any) => {
        console.error('Error loading registrations for edit:', error);
        this.registrations = [];
        if (this.currentAnnouncementForEdit) {
          this.loadCompliancesAndOpenModal(this.currentAnnouncementForEdit);
        }
      }
    });
  }

  private openEditModal(announcement: AnnoucementModel): void {
        // Open the modal
        var modelRef = this.modalService.open(AddAnnouncementsComponent, {
          size: 'xl',
          centered: true,
        });

        // Pass data to the modal component
        modelRef.componentInstance.ActionType = this.ActionType;
        modelRef.componentInstance.RegulationId = this.regulationId;
        modelRef.componentInstance.selectionType = this.selectionType;
        modelRef.componentInstance.compliances = this.compliances;
       
        // Set data based on selection type
        if (this.selectionType === 'regulation') {
          modelRef.componentInstance.RegulationSetupUID = announcement.id;
          modelRef.componentInstance.complianceId = announcement.complianceId;

        } else if (this.selectionType === 'compliance') {
          modelRef.componentInstance.complianceId = announcement.id;
          modelRef.componentInstance.RegulationSetupUID = announcement.regulationId || announcement.id;
        } else if (this.selectionType === 'toc') {
          
          modelRef.componentInstance.RegulationSetupUID = announcement.regulationId || announcement.id;
          modelRef.componentInstance.selectedTocId = this.tocId;
          modelRef.componentInstance.tocDues = this.tocDues || [];
        } else if (this.selectionType === 'registration') {
          modelRef.componentInstance.RegulationSetupUID = announcement.regulationId || announcement.id;
          modelRef.componentInstance.selectedRegistrationId = this.selectedRegistrationId;
          modelRef.componentInstance.registrations = this.registrations || [];
        }
 modelRef.componentInstance.reloadPage.subscribe((event: any) => {
          this.loadAllAnnouncements(this.regulationId,this.selectionType);
        });
        

        // Handle modal result
        // modelRef.result
        //   .then((result) => {
        //     if (result === 'success') {
        //       this.loadAllAnnouncements(); // Reload the announcements list
        //     }
        //   })
        //   .catch((error) => {
        //     console.error('Modal dismissed:', error);
        //   });
  }

  loadRegistrationsFromHistory() {
    if (!this.regulationSetup || this.regulationSetup.length === 0) {
       this.loadRegistrationsFromHistory();
      return;
    }
    
    this.registrations = [];
    this.regulationSetup.forEach(regulation => {
      const regulationRegistrations = regulation.toc?.filter(toc => 
        toc.ruleType && toc.ruleType.toLowerCase().includes('registration')
      ) || [];
      regulationRegistrations.forEach(regToc => {
        const registrationItem = {
          id: regToc.id,
          typeOfComplianceId: regToc.typeOfComplianceId,
          typeOfComplianceName: regToc.typeOfComplianceName,
          ruleType: regToc.ruleType,
          regulationId: regulation.id,
          regulationName: regulation.regulationName,
          registrationName: `${regToc.typeOfComplianceName} - ${regulation.regulationName}`,
          displayName: `${regToc.typeOfComplianceName} - ${regulation.regulationName}`,
          level: 'regulation' 
        };
        this.registrations.push(registrationItem);
        
      });
      regulation.compliance?.forEach(compliance => {
        const complianceRegistrations = compliance.toc?.filter(toc => 
          toc.ruleType && toc.ruleType.toLowerCase().includes('registration')
        ) || [];
        
        complianceRegistrations.forEach(regToc => {
          const registrationItem = {
            id: regToc.id,
            typeOfComplianceId: regToc.typeOfComplianceId,
            typeOfComplianceName: regToc.typeOfComplianceName,
            ruleType: regToc.ruleType,
            regulationId: regulation.id,
            regulationName: regulation.regulationName,
            complianceId: compliance.id,
            complianceName: compliance.complianceName,
            registrationName: `${regToc.typeOfComplianceName} - ${compliance.complianceName}`,
            displayName: `${regToc.typeOfComplianceName} - ${compliance.complianceName}`,
            level: 'compliance' // Mark as compliance level
          };
          this.registrations.push(registrationItem);
          
        });
      });
    });
    
    
    // Log which registration should be preselected
    const preselectedReg = this.registrations.find(reg => reg.id === this.selectedRegistrationId);
    if (preselectedReg) {
    } else {
      console.log('No matching registration found for preselection');
    }
  }

  loadTOCDuesFromHistory() {
    if (!this.regulationSetup || this.regulationSetup.length === 0) {
      this.loadTOCDuesFromHistory()
      return;
    }
    
    this.tocDues = [];
    
    this.regulationSetup.forEach(regulation => {
      const regulationTocDues = regulation.toc?.filter(toc => 
        toc.ruleType && (
          toc.ruleType.toLowerCase().includes('payment') ||
          toc.ruleType.toLowerCase().includes('filing') ||
          toc.ruleType.toLowerCase().includes('activity') ||
          toc.ruleType.toLowerCase().includes('events')
        )
      ) || [];
      
      regulationTocDues.forEach(tocDue => {
        this.tocDues.push({
          ...tocDue,
          regulationId: regulation.id,
          regulationName: regulation.regulationName,
          regulationSetupId: regulation.id,
          tocRuleType: tocDue.ruleType,
          displayName: `${tocDue.ruleType} - ${regulation.regulationName}`,
          id: tocDue.id || tocDue.typeOfComplianceId
        });
      });
      
      regulation.compliance?.forEach(compliance => {
        const complianceTocDues = compliance.toc?.filter(toc => 
          toc.ruleType && (
            toc.ruleType.toLowerCase().includes('payment') ||
            toc.ruleType.toLowerCase().includes('filing') ||
            toc.ruleType.toLowerCase().includes('activity') ||
            toc.ruleType.toLowerCase().includes('events')
          )
        ) || [];
        
        complianceTocDues.forEach(tocDue => {
          this.tocDues.push({
            ...tocDue,
            regulationId: regulation.id,
            regulationName: regulation.regulationName,
            complianceId: compliance.id,
            complianceName: compliance.complianceName,
            regulationSetupId: regulation.id,
            tocRuleType: tocDue.ruleType,
            displayName: `${tocDue.ruleType} - ${compliance.complianceName}`,
            id: tocDue.id || tocDue.typeOfComplianceId
          });
        });
      });
    });
  }

}
