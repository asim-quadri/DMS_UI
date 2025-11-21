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
import {
  ModalDismissReasons,
  NgbDatepickerModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotifierService } from 'angular-notifier';
import { CountryService } from 'src/app/Services/country.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { CountryStateMapping } from 'src/app/Models/countryModel';
import {
  IndustryMapping,
  MajorMinorMapping,
} from 'src/app/Models/industrysetupModel';
import { RegulationGroupModel } from 'src/app/Models/regulationGroupModel';
import { RegulationGroupService } from 'src/app/Services/regulation.service';
import { EntityTypeModel } from 'src/app/Models/entityTypeModel';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { ApiService } from 'src/app/Services/api.service';
import {
  ComplianceListModle,
  RegulationSetupDetailsModel,
  ReuglationListModle,
  TOCListModel,
} from 'src/app/Models/regulationsetupModel';
import { pendingApproval } from 'src/app/Models/pendingapproval';
import { GridApi } from 'ag-grid-community';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { RegulationSetupModule } from '../regulation-setup.module';
import { RegulationApprovalComponent } from '../regulation-approval/regulation-approval.component';
import { MenuOptionModel } from 'src/app/Models/Users';
import { tr } from 'date-fns/locale';

const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
};

@Component({
  selector: 'app-regulation-setup-home',
  templateUrl: './regulation-setup-home.component.html',
  styleUrls: ['./regulation-setup-home.component.scss'],
})
export class RegulationSetupListComponent implements OnInit {
  contextMenuPosition = { x: '0px', y: '0px' };
  showContextMenu = false;
  showComplianceMenu = true;
  showTypeOfComplianceMenu = true;
  hideShowContextMenuContainer = false;
  contextMenuTarget: any;

  expandedRegulations = new Set<number>();
  expandedCompliances = new Set<number>();
  expandedRegulationSetup = new Set<number>();

  @Output()
  listitemchange: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('addRegulationSetupApporoval') addRegulationSetupApporoval: any;
  pendingApproval: pendingApproval | undefined;
  @ViewChild('agGrid') agGrid: any;
  active = 9;
  disabled = true;
  showDiv: boolean = false;
  closeResult = '';
  defaultColumnDef = defaultColumnDef;
  private api: GridApi | undefined;
  regulationSetupCount: string = '.';
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
  complianceId: any;
  complianceName: any;
  regulationId: any;

  regulationSetupName: any;
  majorIndustryId: any;
  isParameterChecked: any;
    isConcernedAndAuthorityChecked: boolean = false;
  regulationSetupDetailsReferenceCode: string | null = null;


  onGridReady(params: any): void {
    this.api = params.api;
  }

  rowData: any[] = [];

  countryStateMapping: CountryStateMapping[] = [];
  industryMapping: IndustryMapping[] = [];
  countryRegulationMapping: RegulationGroupModel[] = [];
  countryEntityTypeMapping: EntityTypeModel[] = [];
  regulationSetup: ReuglationListModle[] = [];
  regulationAllSetup: RegulationSetupDetailsModel[] = [];
  regulationSetupModel: RegulationSetupDetailsModel = {};
  majorMinorMapping: MajorMinorMapping[] = [];
  stateList = [];
  currentComponent = 'ragulation-setup';
  @ViewChild('RegComplianceReview') RegComplianceReview: any;
  @ViewChild('TOCRegistration') TOCRegistration: any;
  @ViewChild('TOCRules') TOCRules: any;
  @ViewChild('RegulationSetupReview') RegulationSetupReview: any;
  RegComplianceUID: any;
  regulationSetupUID: any | undefined;
  approverUID: any;

  regulationSetupScreen: boolean = true;
  RegTOC: TOCListModel | undefined;

  tocRegistrationHistory: any;
  tocRulesHistory: any;

  showAddNewRegulation: boolean = false;
  showApprovalButton: boolean = false;

  ActionType = 'Edit';

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private notifier: NotifierService,
    public regulationSetupService: RegulationSetupService,
    public apiService: ApiService,
    public countryService: CountryService,
    private persistance: PersistenceService,
    private elementRef: ElementRef
  ) {
    //this.ShowCompliance();
    //this.ShowTOC();
    this.ShowRegulationSetup();
  }

  formgroup: FormGroup = this.fb.group({
    countryId: ['', Validators.required],
    stateId: ['', Validators.required],
    regulationType: ['', Validators.required],
    regulationName: ['', Validators.required],
    regulationGroupId: ['', Validators.required],
    description: ['', Validators.required],
  });

  ngOnInit() {
    // this.getCountrStateMapping();
    this.getHistoryRegulationSetup();

    var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 14
      var menuOptions = roleMenuOptions.filter(
        (option: MenuOptionModel) => option.parentId === 14
      );
      console.log('regulation setup Menu Options:', menuOptions);
      if (menuOptions.length > 0) {
        this.showAddNewRegulation =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'Add New Regulation' && option.canView
          ).length > 0;
        
        this.showApprovalButton =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'APPROVALS' && option.canView
          ).length > 0;
      }
      //if logged in user is not a super admin
      console.log('User Role:', this.persistance.getRole());
        if (this.persistance.getRole() !== "1") {
          this.apiService.getMenuOptionsByParentId(14, this.persistance.getUserId()!)
            .subscribe((result: MenuOptionModel[]) => {
              if (result) {
                console.log('User Access for Regulation Setup:', result);
                //if result has "Add New Regulation" option with canView = true
                console.log('Result Titles:', result.map(opt => opt.title));
                this.showAddNewRegulation = result.some(opt => opt.title === 'Add New Regulation Screen' && opt.canView);
                this.showComplianceMenu = result.some(opt => opt.title === 'Complince Screen' && opt.canView);
                this.showTypeOfComplianceMenu = result.some(opt => opt.title === 'Type of Complince Screen' && opt.canView);
                this.hideShowContextMenuContainer = !(this.showComplianceMenu || this.showTypeOfComplianceMenu);
              }
            });
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
    this.isConcernedAndAuthorityChecked = regulation.isConcernedAndAuthorityChecked|| false;
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
    console.log(action, this.contextMenuTarget);
    // Perform the desired action based on the clicked menu item
  }

  toggleRegulationRedirect(regulationId: any) {
    this.currentComponent = '';
    if (this.expandedRegulations.has(regulationId!)) {
      this.expandedRegulations.delete(regulationId!);
    } else {
      this.expandedRegulations.add(regulationId!);
    }
    this.regulationId = regulationId;
    this.regulationSetupUID = null;
    this.ActionType = 'Create';
    setTimeout(() => {
      this.ShowRegulationSetup();
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
    this.regulationSetupUID = regulation.regulationSetupUID;
    this.regulationSetupDetailsReferenceCode =
      regulation.regulationSetupDetailsReferenceCode || null;
    this.ActionType = 'Edit';
    setTimeout(() => {
      this.ShowRegulationSetup();
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
    this.isParameterChecked = regulation.isParameterChecked;
    this.regulationSetupUID = regulation.regulationSetupUID;
    setTimeout(() => {
      this.ShowCompliance();
    }, 500);
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
    setTimeout(() => {
      this.ShowTOC();
    }, 500);
  }

  toggleTocUnderRegulation(
    compliance: TOCListModel,
    regulationsetup: ReuglationListModle
  ) {
    this.currentComponent = '';
    this.complianceId = 0;
    this.regulationId = regulationsetup.id;
    this.RegTOC = compliance!;
    this.isParameterChecked = regulationsetup.isParameterChecked;
    this.regulationSetupUID = regulationsetup.regulationSetupUID;
    this.ActionType = 'Edit';
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

  getCountrStateMapping() {
    this.regulationSetupService
      .getCountryStateMapping()
      .subscribe((result: CountryStateMapping[]) => {
        this.countryStateMapping = result;
        if (this.countryStateMapping.length > 0) {
          this.selectedCountries.push(this.countryStateMapping[0].countryName!);
        }
      });
  }

  getStateById(countryId: any) {
    this.countryService
      .getSateById(countryId, this.persistance.getUserId())
      .subscribe((result: any) => {
        this.formgroup.patchValue({
          stateId: [],
        });
        this.formgroup.updateValueAndValidity();
        this.stateList = result;
      });
  }

  GetMinorIndustrybyMajorID(countryId: any) {
    this.regulationSetupService
      .GetMinorIndustrybyMajorID(countryId)
      .subscribe((result: MajorMinorMapping[]) => {
        this.majorMinorMapping = result;
        // this.formgroup!.patchValue({
        //   minorIndustry: this.entityModel!.minorIndustryId,
        // });
      });
  }

  getHistoryRegulationSetup() {    
    var userId = this.persistance.getRole() === 'SuperAdmin' ? null : this.persistance.getUserId();
    this.regulationSetupService
      .getRegulationSetupHistory(userId)
      .subscribe((result: ReuglationListModle[]) => {
        this.regulationSetup = result;

        this.regulationSetup.forEach((regulation) => {
          regulation.visible = true;
        });
        if (this.regulationSetup.length > 0)
          this.toggleRegulation(this.regulationSetup[0]!);
      });
  }

  getRegulationSetup() {
    this.regulationSetupService
      .getAllRegulationSetupDetails(this.regulationSetupUID)
      .subscribe((result: RegulationSetupDetailsModel[]) => {
        this.regulationAllSetup = result;
      });
  }

  openRegulationSetupReview(event: pendingApproval) {
    this.pendingApproval = event;
    this.openXl(this.addRegulationSetupApporoval);
  }

  selectedCountries: string[] = [];
  selectedMajorIndustry: string[] = [];

  onRightClick(event: MouseEvent) {
    event.preventDefault();
    this.showDiv = true;
    this.addClickListener();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.showDiv = false;
    }
  }

  private addClickListener() {
    setTimeout(() => {
      document.addEventListener('click', this.onDocumentClick.bind(this));
    });
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

  openRegulationApproverModal(data: any) {
    const regListHome = this.modalService.open(RegulationApprovalComponent, {
      size: 'xl',
      centered: true,
    });
    regListHome.componentInstance.reloaddata.subscribe((result: any) => {
      this.reload(result);
    });

    regListHome.componentInstance.sendSelectedUID.subscribe((uid: any) => {
      this.getSelectedUId(uid);
    });

    regListHome.componentInstance.openRegulationSetupReview.subscribe((reviewData: any) => {
      if (this.openRegulationSetupReview) {
        this.openRegulationSetupReview(reviewData);
      }
    });

    // Handle modal close
    regListHome.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
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

  openCountryPopup(event: any) {
    // this.selectedEditRecord = event;
    // this.open(this.country);
  }

  getSelectedUId(event: any) {
    console.log('getSelectedUId called with event:', event); // Debug log
    
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
}
