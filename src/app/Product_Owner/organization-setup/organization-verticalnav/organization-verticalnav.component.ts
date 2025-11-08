import { Component, OnInit, ViewChild, ElementRef, HostListener, EventEmitter, Output, Input, TemplateRef } from '@angular/core';
import { NotifierService } from 'angular-notifier';
//import { ElementRef, HostListener } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { organization } from './organization'
import { OrganizationService } from 'src/app/Services/organization.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { ApiService } from 'src/app/Services/api.service';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { accessModel, pendingApproval } from 'src/app/Models/pendingapproval';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { Constant } from 'src/app/@core/utils/constant';
import { OrganizationDetail, OrganizationEntityList } from 'src/app/Models/organizationModel';
import { OrganizationCountryModel, OrganizationModel } from 'src/app/Models/organizationModel';
import { CountryService } from 'src/app/Services/country.service';
import { CountryModel, CountryStateMapping, StatesModel } from 'src/app/Models/countryModel';
import { password, RxwebValidators } from '@rxweb/reactive-form-validators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BillingLevelModel } from 'src/app/Models/billingLevelModel';
import { ProductTypeModel } from 'src/app/Models/productTypeModel';
import { IndustryMapping, MajorIndustryModel, MinorIndustrypModel } from 'src/app/Models/industrysetupModel';
import { EntityTypeModel } from 'src/app/Models/entityTypeModel';
import { IndustryService } from 'src/app/Services/industry.service';
import { EntityTypeService } from 'src/app/Services/entityType.service';
import { any } from 'underscore';
import { Router } from '@angular/router';
import { EntityService } from 'src/app/Services/entity.service';
import { EntityModel } from 'src/app/Models/entityModel';
import { BillingDetailsService } from 'src/app/Services/billing-details.service';
import { BillingDetailsModel } from 'src/app/Models/billingDetailsModel';
import { MenuOptionModel } from 'src/app/Models/Users';
import { OrganizationApprovalComponent } from '../organization-approval/organization-approval.component';

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
  selector: 'app-organization-verticalnav',
  templateUrl: './organization-verticalnav.component.html',
  styleUrls: ['./organization-verticalnav.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition('void <=> *', animate(300)) // Adjust the animation duration as needed
    ])
  ],
  providers: [organization]
})

export class OrganizationVerticalnavComponent implements OnInit {
  showDiv: boolean = false;
  closeResult = '';
  currentUserUID: string | null = "";
  organizationName: OrganizationDetail[] = [];//
  organizationNameWithoutStatus: OrganizationDetail[] = [];//
  countries: CountryModel[] = [];
  states: StatesModel[] = [];
  billingLevel: BillingLevelModel[] = [];
  typeOfProduct: ProductTypeModel[] = [];
  countryStateMapping: CountryStateMapping[] = [];
  selectedMinorIndustryList: MinorIndustrypModel[] = [];
  selectedMajorIndustryList: MajorIndustryModel[] = [];
  selectedEntityList: EntityTypeModel[] = [];
  selectedCountries: string[] = [];
  stateList = [];
  selectedStateList: any[] = [];
  selectedCountryList: any[] = [];
  approvedCount: number = 0;
  rejectedCount: number = 0;
  pendingCount: number = 0;
  approvalForm: FormGroup;
  selectedRowData: any = {};
  selectedOrganizationNameTop: string = "";
  organizationEntityList: OrganizationEntityList[] = [];
  entityId: number = 1;
  entityData: any[] = [];
  entityDetails: any = {};
  billingDetails: any = {};
  userId: number | null = 1;
  entityStatus: string = '';
  showAddNewOrganizationButton = true;
  orgApprovalCount: string = '.';

  @Input()
  modal: any;
  industryMapping: IndustryMapping[] = [];
  countryEntityTypeMapping: EntityTypeModel[] = [];
  selectedEntity: OrganizationModel[] = [];
  organizationList: any;


  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  public addMapping = {
    countryDD: {
      singleSelection: false, // Set to false for multiple selection
      idField: 'id',
      textField: 'countryName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      data: [] as any,
      countries: [] as CountryModel[],
    },
    isLoaded: true,
    isSubmit: false,
  };

  public rowSelection: 'single' | 'multiple' = 'multiple';
  private gridApi: GridApi | undefined;
  private currentModalRef?: NgbModalRef;
  defaultColumnDef = defaultColumnDef;
  @ViewChild('agGrid') agGrid: any;
  @ViewChild('organizationapproval') organizationapproval: any;
  @ViewChild('entityapproval') entityapproval: any;
  @ViewChild('billingapproval') billingapproval: any;
  @ViewChild('Approvals') approvalsModal!: TemplateRef<any>;
  rowData: any[] = [];
  private modalRef: NgbModalRef | null = null;
  columnDefs: ColDef[] = [
    { headerName: '', checkboxSelection: true, headerCheckboxSelection: true, width: 50 },
    { headerName: 'organizationId', field: 'organizationId', hide: true },
    { headerName: 'entityId', field: 'entityId', hide: true },
    { headerName: 'billingDetailsId', field: 'billingDetailsId', hide: true },
    { headerName: 'S.No', valueGetter: 'node.rowIndex + 1', width: 80 },
    { headerName: 'Type', field: 'type', width: 150 },
    { headerName: 'Name', field: 'name', width: 150 },
    { headerName: 'Customer ID', field: 'customerId', width: 100 },
    { headerName: 'Point of Contact', field: 'pointOfContact', width: 150 },
    { headerName: 'Approver', field: 'approvedby', width: 150 },
    { headerName: 'Onboarding Stage', field: 'onboardingStage', width: 150 },
    { headerName: 'Status', field: 'status', width: 100 },
  ];
  clearFormEvent: any;

  showContextMenu = false;
  showEntityContextMenu = false;
  contextMenuPosition = { x: 0, y: 0 };
  selectedOrg: any;
  allowedEntityCount: number = 0;
  currentEntityCount: number = 0;
  canAddNewEntity: boolean = true;
  selectedEnt: any;
  showAddNewEntityButton: boolean = false;
  showAddNewBillingButton: boolean = false;
  showApprovalButton: boolean = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private elementRef: ElementRef,
    public countryService: CountryService,
    private organizationService: OrganizationService,
    public industryService: IndustryService,
    public entityTypeService: EntityTypeService,
    private entityService: EntityService,
    private persistance: PersistenceService,
    private billingService: BillingDetailsService,
    public apiService: ApiService,
    private notifier: NotifierService
  ) {
    this.approvalForm = this.fb.group({
      organizationName: [{ value: '', disabled: true }, Validators.required],
      entity: ['', Validators.required],
      countryId: [null, Validators.required],
      countryDDId: [null, Validators.required],
      stateId: [null, Validators.required],
      city: ['', Validators.required],
      entityType: [null, Validators.required],
      majorIndustry: [null, Validators.required],
      minorIndustry: [null, Validators.required],
      address: ['', Validators.required],
      pin: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      typeOfProduct: [null, Validators.required],
      numberOfEntities: ['', Validators.required],
      numberOfUsers: ['', Validators.required],
      billingLevel: [null, Validators.required],
      fullName: [null, Validators.required],
      emailID: [null, Validators.required],
      designation: [null, Validators.required],
      password: [null, Validators.required]
    });

    this.approvalForm.disable();
  }

  formgroup: FormGroup = this.fb.group({
    organizationName: ['', [RxwebValidators.required({ message: 'Select Organization name' })]]
  });

  open(content: any, data?: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {

      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  // onRowClicked(event: any): void {
  //   const selectedRowData = event.organizationapproval;
  //   this.selectedEditRecord = selectedRowData;
  //   this.openXl(this.organizationapproval);
  // }
  notifyMaxEntitiesReached() {
    if ((this.currentEntityCount ?? 0) >= (this.allowedEntityCount ?? 0)) {
      this.notifier.notify("error", "Already exceeded the maximum entities allowed.");
    }
  }
  openApprovalOrganization() {
    this.modalRef = this.modalService.open(OrganizationApprovalComponent, { size: 'xl', centered: true });

    this.modalRef.result.then(
      (result) => {
        // Handle close result if needed
      },
      (reason) => {
        // Handle dismiss reason if needed
      }
    );
  }
  // openXl(content: any) {
  //   
  //   this.modalService.open(content, { size: 'xl', centered: true });
  // }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  addEntity(id: number) {
    this.router.navigate(['/organization-setup/entity/', id]);
  }
  addBillingDetails(id: number, entityId?: number) {
    let url = '/organization-setup/billing-details/' + id + '/0';
    if (entityId != undefined && entityId != null)
      url = '/organization-setup/billing-details/' + id + '/' + entityId;
    this.router.navigate([url]);
  }

  editEntity(entityId: number, orgId: number) {
    this.router.navigate(['/organization-setup/entity-details/', entityId, orgId]);
  }

  getOrgEntityList() {
    this.organizationService.getOrgEntityList().subscribe((result: OrganizationEntityList[]) => {
      console.log("result", result);
      this.organizationEntityList = result;
    });
  }

  onOrganizationSelect(event: any) {
    this.router.navigate(['/organization-setup/organization']);
    let id: number = Number(event);

    console.log('Organization ID:', id);
    console.log('Organization List:', this.organizationName);

    const selectedOrganization = this.organizationName.find(
      (OrganizationDetail) => OrganizationDetail.id === id
    );
    this.organizationService.setSelectedOrganization(selectedOrganization);
  }

  clearFormAndNotify(): void {
    this.organizationService.setClearForm(true);
  }


  ngOnInit(): void {
    var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 3
      var menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 3);
      console.log('Org setup Menu Options:', menuOptions);
      if (menuOptions.length > 0) {
        this.showAddNewEntityButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Add New Entity' && option.canView).length > 0;
        this.showAddNewBillingButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Add New Billing' && option.canView).length > 0;
        this.showApprovalButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'APPROVALS' && option.canView).length > 0;
        if (this.showAddNewEntityButton || this.showAddNewBillingButton) {
          this.showContextMenu = false;
        }
      }
    }



    this.currentUserUID = this.persistance.getUserUID();
    document.addEventListener('click', this.onDocumentClick.bind(this));
    this.getOrgEntityList();
    this.getOrganizations();
    this.getOrgEntityList();
    this.getOrganizationApproval();

    console.log("hi from organization-verticalnav.component.ts");
    this.apiService.getMenuOptionsByParentId(3, this.persistance.getUserId()!).subscribe((result: MenuOptionModel[]) => {
      this.showAddNewOrganizationButton = result.some(option => option.title === 'Add New Organization Screen' && option.canView);
      if (this.persistance.getRoleId() == 1) {
        this.showAddNewOrganizationButton = true;
      }
      console.log("showAddNewOrganizationButton", this.showAddNewOrganizationButton);
    });
    this.formgroup.get('organizationName')?.valueChanges.subscribe(value => {
      this.onOrganizationSelect(value);
    });

    this.organizationService.getOrgAddOrUpdate().subscribe((res) => {
      if (res) {
      }
    });
  }

  loadData(organization: any) {

    console.log("organization Inside LoadData", organization);
    const selectedCountryIds = organization.countryId.split(',').map((id: string) => id.trim());
    const selectedCountries = this.addMapping.countryDD.data.filter((country: any) => selectedCountryIds.includes(country.id.toString()));

    this.approvalForm.patchValue({
      organizationName: organization.organizationName,
      entity: organization.primaryEntity,
      countryId: selectedCountries,
      countryDDId: organization.countryDDId,
      stateId: organization.stateId,
      city: organization.city,
      entityType: organization.entityTypeId,
      majorIndustry: organization.majorIndustryId,
      minorIndustry: organization.minorIndustryId,
      address: organization.address,
      pin: organization.pin,
      typeOfProduct: organization.typeOfProduct,
      numberOfEntities: organization.numberOfEntities,
      numberOfUsers: organization.numberOfUsers,
      billingLevel: organization.billingLevelId,
      fullName: organization.fullName,
      emailID: organization.emailID,
      designation: organization.designation,
      password: organization.password,
    });
  }


  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (event.target.classList.contains('modal')) {
      this.modalService.dismissAll();
    }
  }

  getOrganizationApproval() {
    this.userId = this.persistance.getUserId()!;
    this.entityService.getEntityApprovalList(this.userId).subscribe((res) => {
      this.rowData = res;
      this.getCounts(this.rowData);
    });
  }
  getOrganizations(): void {
    //let user = null;
    //var managerId =  this.persistance.getManagerId();
    //if(managerId != null && managerId != 0){
    //}
    // this.organizationService.getOrganizations(user).subscribe((result: any) => {
    //   this.organizationName = result;
    //   console.log("this.organizationName", this.organizationName);
    //   //this.addMapping.countryDD.data = result;  // Update the data for the dropdown
    // });

    this.organizationService.getOrganizations().subscribe((result: any) => {
      this.organizationName = result.map((organization: any) => {
        return {
          ...organization,
          isOrganization: organization.billingLevelId === 1,
          isBilling: organization.billingLevelId === 2,
          OrganizationName: organization.organizationName,
          CreatedBy: organization.createdBy,
          fullName: organization.fullName,
          status: organization.status,
          organizationId: organization.organizationId,
          type: organization.type,
          country: organization.country,
          primaryEntity: organization.primaryEntity,
          numberOfEntities: organization.numberOfEntities 
        };
      });
      console.log('this.organizationName', this.organizationName);
      // this.addMapping.countryDD.data = result;  // Update the data for the dropdown
    });
  }

  // @HostListener('document:click', ['$event'])
  // onDocumentClick(event: MouseEvent) {
  //   const clickedInside = this.elementRef.nativeElement.contains(event.target);
  //   if (!clickedInside) {
  //     this.showDiv = false;
  //   }
  // }

  // onRightClick(event: MouseEvent) {
  //   event.preventDefault();
  //   this.showDiv = true;
  //   this.addClickListener();
  // }

  onRightClick(event: MouseEvent, organization: any) {
    this.showEntityContextMenu = false;
    event.preventDefault();

    if (this.showAddNewEntityButton || this.showAddNewBillingButton) {
      this.showContextMenu = true;
    }
    this.contextMenuPosition.x = event.clientX;
    this.contextMenuPosition.y = event.clientY;
    this.selectedOrg = organization;
    sessionStorage.setItem('organizationNm', this.selectedOrg.organizationName);
    const fullOrg = this.organizationName.find(org => org.id === organization.id);
    this.allowedEntityCount = fullOrg ? Number(fullOrg.numberOfEntities) : 0;
    const orgEntity = this.organizationEntityList.find(org => org.id === organization.id);
    this.currentEntityCount = orgEntity ? (orgEntity.entityList?.length || 0) : 0;
    this.canAddNewEntity = this.currentEntityCount < this.allowedEntityCount;
  }

  onRightClickEntity(event: MouseEvent, organization: any, entity: any) {
    this.showContextMenu = false;
    event.preventDefault();
    this.showEntityContextMenu = true;
    this.contextMenuPosition.x = event.clientX;
    this.contextMenuPosition.y = event.clientY;
    this.selectedOrg = organization;
    this.selectedEnt = entity;
  }

  onDocumentClick() {
    this.showContextMenu = false;
    this.showEntityContextMenu = false;
  }

  // private addClickListener() {
  //   setTimeout(() => {
  //     document.addEventListener('click', this.onDocumentClick.bind(this));
  //   });
  // }

  submit(f: any) {
    console.log(f);
  }

  acceptSelected(): void {

    var sourece: Observable<any>[] = [];
    var selectedRows = this.gridApi!.getSelectedRows();
    selectedRows?.forEach((item) => {
      if (item.status == "Pending") {
        var model: accessModel = {
          managerId: this.persistance.getManagerId(),
          createdBy: this.persistance.getUserId()!,
          uid: item.uid
        };
        if (item.type == "Organization" && item.createdBy != this.persistance.getUserId()) {
          model.userId = item.userId;
          sourece.push(this.organizationService.submitOrganizationApproved(model));
          this.reloaddata.emit();
        }
      }
    });

    //   if (sourece.length > 0) {
    //     forkJoin(sourece).subscribe(results => {
    //     // Assuming results is an array of responses from API calls
    //     results.forEach((result, index) => {
    //       // Update the status locally assuming API call was successful
    //       selectedRows[index].status = "Approved";
    //     });
    //     this.gridApi!.applyTransaction({ update: selectedRows });
    //     this.reloaddata.emit(); // Refresh grid if needed
    //   });
    // }

    if (sourece.length > 0) {
      this.organizationService.multipleAPIRequests(sourece).subscribe((result) => {

        console.log(result);
        //this.gridApi!.applyTransaction({ update: selectedRows });
        this.reloaddata.emit();
      });
    }
    // Perform accept action on selectedData
    console.log('Accepted:', selectedRows);
  }

  getCounts(data: any[]) {
    // Iterate through each object in the array
    data.forEach(item => {
      // Check if the status is 'Approved'
      if (item.status.toLowerCase().trim() === 'approved') {
        this.approvedCount++; // Increment the count if status is 'Approved'
      }
      // Check if the status is 'Rejected'
      if (item.status.toLowerCase().trim() === 'rejected') {
        this.rejectedCount++; // Increment the count if status is 'Rejected'
      }
      // Check if the status is 'Pending'
      if (item.status.toLowerCase().trim() === 'pending') {
        this.pendingCount++; // Increment the count if status is 'Pending'
      }
    });
  }

  onCountryChange(event: any) {
    console.log('Event:', event);
    const selectedValue = event.target.value;
    console.log('Selected Value:', selectedValue);

  }

  //

  searchOrganizationEntity(keyword: any) {
    this.searchOrganizationEntityKeyword(keyword.target.value);
  }


  searchOrganizationEntityKeyword(keyword: any) {
    const lower = keyword.toLowerCase();

    this.organizationEntityList.forEach(org => {
      let orgMatch = org.organizationName?.toLowerCase().includes(lower) ?? false;

      let anyEntityMatch = false;
      org.entityList.forEach(entity => {
        const match = entity.entityName?.toLowerCase().includes(lower) ?? false;
        entity.hide = !match;
        if (match) anyEntityMatch = true;
      });

      // Show organization if it or any of its entities match
      org.hide = !(orgMatch || anyEntityMatch);
    });
  }

  clearSearch() {
    this.organizationEntityList.forEach(org => {
      org.hide = false;
      org.entityList.forEach(entity => (entity.hide = false));
    });
  }

}
