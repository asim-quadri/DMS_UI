import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { password, RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import {
  OrganizationCountryModel,
  OrganizationModel,
} from 'src/app/Models/organizationModel';
import { OrganizationService } from 'src/app/Services/organization.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { CountryService } from 'src/app/Services/country.service';
import {
  CountryModel,
  CountryStateMapping,
  StatesModel,
} from 'src/app/Models/countryModel';
import { Constant } from 'src/app/@core/utils/constant';
import { BillingLevelModel } from 'src/app/Models/billingLevelModel';
import { ProductTypeModel } from 'src/app/Models/productTypeModel';
import {
  IndustryMapping,
  MajorIndustryModel,
  MajorMinorMapping,
  MinorIndustrypModel,
} from 'src/app/Models/industrysetupModel';
import { IndustryService } from 'src/app/Services/industry.service';
import { Observable, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { EntityTypeModel } from 'src/app/Models/entityTypeModel';
import { EntityTypeService } from 'src/app/Services/entityType.service';
import { organization } from '../organization-details/organization';
import { BillingDetailsService } from 'src/app/Services/billing-details.service';
import { BillingDetailsModel } from 'src/app/Models/billingDetailsModel';
import { GridApi } from 'ag-grid-community';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EntityModel, Months, Years } from 'src/app/Models/entityModel';
import { EntityService } from 'src/app/Services/entity.service';

const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
  pagination: true,
};
import { RolesModels } from 'src/app/Models/roles';
import { MenuOptionModel } from 'src/app/Models/Users';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-new-organization',
  templateUrl: './new-organization.component.html',
  styleUrls: ['./new-organization.component.scss'],
})
export class NewOrganizationComponent implements OnInit {
  headerLabel: string = 'Add New Organization';
  buttonLabel: string = 'Add Organization';
  currentApprovalRecord: any;
  countries: CountryModel[] = [];
  states: StatesModel[] = [];
  billingLevel: BillingLevelModel[] = [];
  typeOfProduct: ProductTypeModel[] = [];
  Roles: RolesModels[] = [];
  countryStateMapping: CountryStateMapping[] = [];
  selectedCountries: string[] = [];
  stateList = [];
  selectedStateList: any[] = [];
  selectedCountryList: any[] = [];
  majorindustry = [];
  minorindustry: MinorIndustrypModel[] = [];
  selectedMajorIndustryList: MajorIndustryModel[] = [];
  selectedMinorIndustryList: MinorIndustrypModel[] = [];
  organizationCountry: OrganizationCountryModel[] = [];
  @Input()
  modal: any;
  industryMapping: IndustryMapping[] = [];
  countryEntityTypeMapping: EntityTypeModel[] = [];
  selectedEntityList: EntityTypeModel[] = [];
  selectedEntity: OrganizationModel[] = [];
  selectedEditRecord: any;
  isEditMode: boolean = false;
  organizationList: any;
  isClearForm: boolean = false;
  showOrgDiv: boolean = true;
  showBillingDiv: boolean = false;
  billingDetails: any = [];
  defaultColumnDef = defaultColumnDef;
  rowData: any[] = [];
  majorMinorMapping: MajorMinorMapping[] = [];
  selectedMajorIndustries: string[] = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  isNewOrg = false;
  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();
  private api: GridApi | undefined;
  years: Years[] = [];
  months: any = {};
  showAddNewOrganizationButton: boolean = true;
  checkBilling = false;
  onGridReady(params: any): void {
    this.api = params.api;
  }
  private currentModalRef?: NgbModalRef;
  @ViewChild('billingdetails') billingdetails: any;
  constructor(
    private fb: FormBuilder,
    public countryService: CountryService,
    public organizationService: OrganizationService,
    private notifier: NotifierService,
    private persistance: PersistenceService,
    public industryService: IndustryService,
    public entityService: EntityService,
    private modalService: NgbModal,
    private billingService: BillingDetailsService,
    public entityTypeService: EntityTypeService,
    private route: ActivatedRoute
  ) {
    this.checkBilling =
      this.route.snapshot.queryParamMap.get('checkBilling') === 'true';
    this.years = this.getYears();
    this.headerLabel = 'Add New Organization';
    this.buttonLabel = 'Add Organization';
    this.formgroup = this.fb.group({
      organizationName: ['', Validators.required],
      entity: ['', Validators.required],
      countryId: ['', Validators.required],
      countryDDId: ['', Validators.required],
      stateId: ['', Validators.required],
      city: ['', Validators.required],
      entityType: ['', Validators.required],
      majorIndustry: ['', Validators.required],
      minorIndustry: ['', Validators.required],
      address: ['', Validators.required],
      pin: ['', [Validators.required, Validators.pattern('[0-9]{5}')]],
      typeOfProduct: ['', Validators.required],
      numberOfEntities: ['', Validators.required],
      numberOfUsers: ['', Validators.required],
      billingLevel: ['', Validators.required],
      fullName: ['', Validators.required],
      emailID: [
        '',
        [
          RxwebValidators.required({ message: 'Email address is required' }),
          RxwebValidators.email({ message: 'Invalid Email Address' }),
        ],
      ],
      designation: ['', Validators.required],
      password: ['', Validators.required],
      financialYearStart: ['', Validators.required],
      financialYearEnd: ['', Validators.required],
      fromMonth: ['', Validators.required],
      toMonth: ['', Validators.required],
      noofBranches: ['', Validators.required],
      roleId: ['', Validators.required],
    });
    this.formgroup.reset();
  }

  public addMapping = {
    countryDD: {
      singleSelection: false, // Set to false for multiple selection
      idField: 'id',
      textField: 'countryName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      // itemsShowLimit: 3,
      data: [] as any,
      countries: [] as CountryModel[],
    },
    isLoaded: true,
    isSubmit: false,
  };

  ngOnInit(): void {
    this.isEditMode = false;
    this.isClearForm = false;
    this.getCountries();
    this.getCountrStateMapping();
    this.getAllBillingLevel();
    this.getAllProductType();
    this.GetRoles();
    if (this.checkBilling) {
      this.onBillingCheckboxChange({ target: { checked: true } });
    }
    this.organizationService.getClearForm().subscribe((res) => {
      if (res) {
        this.clearForm();
        this.formgroup.patchValue({
          // countryId: this.selectedCountries,
          // password: Math.random().toString(36).slice(-8)
        });
        this.isNewOrg = true;
      }
    });

    // window.addEventListener('clearForm', () => {
    //   this.clearForm();
    // });

    //Initialize selected countries if needed
    this.formgroup.patchValue({
      // countryId: this.selectedCountries,
      password: Math.random().toString(36).slice(-8),
    });

    this.organizationService
      .getSelectedOrganization()
      .subscribe((organization) => {
        if (organization) {
          this.isNewOrg = false;
          this.organizationList = organization;
          this.isEditMode = true;
          this.isClearForm = false;
          console.log('dataOnChange', organization);
          this.getStateById(organization.countryDDId);
          this.bindFormDatas();
          this.getBillingDetailsByOrgId();
          //this.loadData(organization);
          (async () => {
            await new Promise((resolve) =>
              setTimeout(() => this.loadData(organization), 1500)
            ).then(() => console.log('fired'));
          })();
        }
      });

    var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 3
      var menuOptions = roleMenuOptions.filter(
        (option: MenuOptionModel) => option.parentId === 3
      );
      console.log('Org setup Menu Options:', menuOptions);
      if (menuOptions.length > 0) {
        this.showAddNewOrganizationButton =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'Add Organization' && option.canView
          ).length > 0;
      }
    }
  }

  loadData(organization: any) {
    this.getBillingDetailsByOrgId();
    console.log('organization Inside LoadData', organization);
    const selectedCountryIds = organization.countryId
      .split(',')
      .map((id: string) => id.trim());
    const selectedCountries = this.addMapping.countryDD.data.filter(
      (country: any) => selectedCountryIds.includes(country.id.toString())
    );

    this.formgroup.patchValue({
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
      financialYearStart: organization.financialYearStart,
      financialYearEnd: organization.financialYearEnd,
      fromMonth: organization.fromMonth,
      toMonth: organization.toMonth,
      noofBranches: organization.noofBranches,
      roleId: organization.roleId,
    });
    this.GetMinorIndustrybyMajorID();
    this.formgroup.updateValueAndValidity();
  }
  clearForm(): void {
    this.formgroup.reset(); // Reset the form to initial state
    this.isClearForm = true;
  }

  bindFormDatas() {
    // this.getCountries();
    this.getCountrStateMapping();
    this.getAllBillingLevel();
    this.getAllProductType();
  }

  formgroup: FormGroup = this.fb.group({
    organizationName: [
      '',
      [RxwebValidators.required({ message: 'Organization name is required' })],
    ],
    entity: ['', RxwebValidators.required({ message: 'Entity is required' })],
    countryId: [
      '',
      RxwebValidators.required({
        message: 'Application onboarding countries are required',
      }),
    ],
    countryDDId: [
      '',
      RxwebValidators.required({ message: 'Country is required' }),
    ],
    stateId: ['', RxwebValidators.required({ message: 'State is required' })],
    city: ['', RxwebValidators.required({ message: 'City is required' })],
    address: ['', RxwebValidators.required({ message: 'Address is required' })],
    pin: [
      '',
      [
        RxwebValidators.required({ message: 'PIN is required' }),
        RxwebValidators.pattern({
          expression: { onlyNumbers: /^\d{6}$/ },
          message: 'Invalid PIN',
        }),
      ],
    ],
    typeOfProduct: [
      '',
      RxwebValidators.required({ message: 'Type of product is required' }),
    ],
    numberOfEntities: [
      '',
      RxwebValidators.required({ message: 'Number of entities is required' }),
    ],
    numberOfUsers: [
      '',
      RxwebValidators.required({ message: 'Number of users is required' }),
    ],
    billingLevel: [
      '',
      RxwebValidators.required({ message: 'Billing level is required' }),
    ],
    entityType: [
      '',
      RxwebValidators.required({ message: 'Entity type is required' }),
    ],
    majorIndustry: [
      '',
      RxwebValidators.required({ message: 'Major industry is required' }),
    ],
    minorIndustry: [
      '',
      RxwebValidators.required({ message: 'Minor industry is required' }),
    ],
    fullName: [
      '',
      [RxwebValidators.required({ message: 'Full name is required' })],
    ],
    emailID: [
      '',
      [
        RxwebValidators.required({ message: 'Email ID is required' }),
        RxwebValidators.email({ message: 'Invalid Email Address' }),
      ],
    ],
    designation: [
      '',
      [RxwebValidators.required({ message: 'Designation is required' })],
    ],
    password: [
      '',
      [RxwebValidators.required({ message: 'Password is required' })],
    ],
    financialYearStart: [
      '',
      RxwebValidators.required({ message: 'Major industry is required' }),
    ],
    financialYearEnd: [
      '',
      RxwebValidators.required({ message: 'Minor industry is required' }),
    ],
    fromMonth: [
      '',
      RxwebValidators.required({ message: 'Major industry is required' }),
    ],
    toMonth: [
      '',
      RxwebValidators.required({ message: 'Minor industry is required' }),
    ],
    noofBranches: [
      '',
      [RxwebValidators.required({ message: 'NoofBranches is required' })],
    ],
    roleId: [
      '',
      [RxwebValidators.required({ message: 'NoofBranches is required' })],
    ],
  });

  getCountries() {
    const userId = this.persistance.getUserId()!;
    this.countryService.getAllCountryMaster(userId).subscribe((result: any) => {
      this.countries = result;
      console.log('countries', this.countries);
      this.addMapping.countryDD.data = result; // Update the data for the dropdown
    });
  }

  GetRoles() {
    this.organizationService.getAllRoles().subscribe((result: any) => {
      this.Roles = result;
    });
  }

  onCountryChange(event: any) {
    console.log('Event:', event);
    const selectedValue = event.target.value;
    console.log('Selected Value:', selectedValue);

    this.getStateById(selectedValue);
    this.getStartAndEndMonths(selectedValue);
  }

  getStateById(countryId: any) {
    console.log('countryId', countryId);
    return this.countryService
      .getSateById(countryId, this.persistance.getUserId())
      .pipe(
        switchMap((result: any) => {
          this.formgroup.updateValueAndValidity();
          this.stateList = result;
          // Fetch industry mappings and return as observable
          return this.industryService.getIndustryMapping();
        }),
        switchMap((result: IndustryMapping[]) => {
          this.industryMapping = result;

          // Filter industry mappings based on countryId
          const filteredMappings = this.industryMapping.filter(
            (x) => x.countryId?.toString() === countryId?.toString()
          );

          // Map filtered industry mappings to new major industry items
          this.selectedMajorIndustryList = filteredMappings.map((x) => ({
            id: x.majorIndustryId !== null ? x.majorIndustryId : 0,
            countryId: Number(x.countryId),
            majorIndustryName:
              x.majorIndustryName !== null ? x.majorIndustryName : '',
            majorIndustryCode:
              x.majorIndustryCode !== null ? x.majorIndustryCode : '',
            status: null,
            createdOn: x.createdOn !== undefined ? x.createdOn : null,
            createdBy: x.createdBy !== undefined ? x.createdBy : null,
            modifiedOn: x.modifiedOn !== undefined ? x.modifiedOn : null,
            modifiedBy: x.modifiedBy !== undefined ? x.modifiedBy : null,
            uid: null,
            managerId: x.managerId !== null ? x.managerId : null,
            ApprovalUID: null,
          }));
          this.selectedMajorIndustryList =
            this.selectedMajorIndustryList.filter(
              (value, index, self) =>
                index ===
                self.findIndex(
                  (v) =>
                    v.id === value.id &&
                    v.majorIndustryName === value.majorIndustryName
                )
            );

          // Map filtered industry mappings to new minor industry items
          this.selectedMinorIndustryList = filteredMappings.map((x) => ({
            id: x.minorIndustryId !== null ? x.minorIndustryId : 0,
            majorIndustryId: x.majorIndustryId !== null ? x.majorIndustryId : 0,
            minorIndustryName:
              x.minorIndustryName !== null ? x.minorIndustryName : '',
            minorIndustryCode:
              x.minorIndustryCode !== null ? x.minorIndustryCode : '',
            status: null,
            createdOn: x.createdOn !== undefined ? x.createdOn : null,
            createdBy: x.createdBy !== undefined ? x.createdBy : null,
            modifiedOn: x.modifiedOn !== undefined ? x.modifiedOn : null,
            modifiedBy: x.modifiedBy !== undefined ? x.modifiedBy : null,
            uid: null,
            managerId: x.managerId !== null ? x.managerId : null,
            ApprovalUID: null,
          }));

          // Fetch industry mappings and return as observable
          return this.entityTypeService.getCountryEntityTypeMapping();
          //  return of('done');
        }),
        switchMap((result: EntityTypeModel[]) => {
          this.countryEntityTypeMapping = result;

          // Filter industry mappings based on countryId
          const filteredMappings = this.countryEntityTypeMapping.filter(
            (x) => x.countryId?.toString() === countryId?.toString()
          );

          // Map filtered industry mappings to new minor industry items
          this.selectedEntityList = filteredMappings.map((x) => ({
            id: x.id !== undefined ? x.id : 0,
            entityTypeId: x.entityTypeId !== undefined ? x.entityTypeId : 0,
            countryId:
              Number(x.countryId) !== undefined ? Number(x.countryId) : 0,
            countryName: x.countryName !== undefined ? x.countryName : null,
            managerId: x.managerId !== undefined ? x.managerId : 0,
            entityType: x.entityType !== undefined ? x.entityType : null,
            entityTypeCode:
              x.entityTypeCode !== undefined ? x.entityTypeCode : null,
            countryEntityTypeMappingId:
              x.countryEntityTypeMappingId !== undefined
                ? x.countryEntityTypeMappingId
                : 0,
            approvalStatus:
              x.approvalStatus !== undefined ? x.approvalStatus : null,
            fullName: x.fullName !== undefined ? x.fullName : null,
            statusId: x.statusId !== undefined ? x.statusId : 0,
            createdOn: x.createdOn !== undefined ? x.createdOn : null,
            createdBy: x.createdBy !== undefined ? x.createdBy : undefined, // Ensure createdBy is correctly handled
            modifiedOn: x.modifiedOn !== undefined ? x.modifiedOn : null,
            modifiedBy: x.modifiedBy !== undefined ? x.modifiedBy : 0,
            uid: null,
            hide: x.hide !== undefined ? x.hide : false,
          }));

          // Return a dummy observable or use 'of' to fulfill the requirement
          return of('done');
        })
      )
      .subscribe((result: any) => {
        // You can perform any post-processing logic here if needed
        if (result) {
          this.bindFormDatas();
        }
      });
  }

  getCountrStateMapping() {
    this.countryService
      .getCountryStateMapping()
      .subscribe((result: CountryStateMapping[]) => {
        this.countryStateMapping = result;
        if (this.countryStateMapping.length > 0) {
          this.selectedCountries.push(this.countryStateMapping[0].countryName!);
        }
      });
  }

  getAllBillingLevel(): void {
    this.organizationService.getAllBillingLevel().subscribe((result: any) => {
      this.billingLevel = result;
      console.log('this.billingLevel', this.billingLevel);
    });
  }

  getAllProductType(): void {
    this.organizationService.getAllProductType().subscribe((result: any) => {
      this.typeOfProduct = result;
      console.log('this.typeOfProduct', this.typeOfProduct);
    });
  }

  getBillingLevelById(): void {}
  onOrgCheckboxChange(event: any) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.showOrgDiv = true;
      this.showBillingDiv = false;
    }
  }
  onBillingCheckboxChange(event: any) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.showOrgDiv = false;
      this.showBillingDiv = true;
    }
  }
  getBillingDetailsByOrgId() {
    this.billingService
      .GetBillingDetailsViewByOrgId(this.organizationList.id)
      .subscribe((res: Array<BillingDetailsModel>) => {
        this.billingDetails = res;
        this.rowData = res;
        console.log('this.billingDetails ');
        console.log(this.billingDetails);
      });
  }
  columnDefs = [
    // { headerName: 'id', field: 'id', hide: true },
    // { headerName: 'uid', field: 'uid', hide: true },
    { headerName: 'Bill Number', field: 'billNumber', flex: 1, minWidth: 150 },
    {
      headerName: 'Billing Frequency',
      field: 'frequency',
      flex: 1,
      minWidth: 150,
    },
    {
      headerName: 'Billing Date',
      field: 'billDateString',
      flex: 1,
      minWidth: 120,
    },
    { headerName: 'Total Fee', field: 'totalFee', flex: 1, minWidth: 120 },
    {
      headerName: 'Received Amount',
      field: 'receivedAmount',
      flex: 1,
      minWidth: 150,
    },
    {
      headerName: 'Collection Date',
      field: 'collectionDateString',
      flex: 1,
      minWidth: 150,
    },
    {
      headerName: 'Bill Status',
      field: 'billStatusName',
      flex: 1,
      minWidth: 120,
    },
  ];
  onRowClicked(event: any): void {
    let billingId: number = event.data.id;
    this.billingService
      .GetBillingDetailsView(billingId)
      .subscribe((res: BillingDetailsModel) => {
        this.billingDetails = res;
      });
    this.openXl(this.billingdetails);
  }
  openXl(content: any | TemplateRef<any>) {
    if (content instanceof TemplateRef) {
      this.currentModalRef = this.modalService.open(content, { size: 'xl' });
    } else {
      this.modalService.open(content, { size: 'xl', centered: true });
    }
  }

  clearFormAndNotify(): void {
    this.organizationService.setClearForm(true);
  }
  onSubmit() {
    // if (this.formgroup.valid) {

    var organization: OrganizationModel = { ...this.formgroup.value };
    console.log('organization submit', organization);

    // Temporary variable to store countryId array
    const countryIdArray: { id: number; countryName: string }[] =
      organization.countryId as any;

    // Convert countryId array to CSV string
    if (countryIdArray && countryIdArray.length > 0) {
      organization.countryId = countryIdArray.map((c) => c.id).join(',');
    }

    // Assign typeOfProduct from form value to organization.typeOfProduct
    organization.typeOfProduct = this.formgroup.get('typeOfProduct')?.value;
    organization.createdBy = this.persistance.getUserId()!;
    organization.managerId = this.persistance.getManagerId()!;
    organization.billingLevelId = this.formgroup.get('billingLevel')?.value;
    organization.primaryEntity = this.formgroup.get('entity')?.value;
    organization.fullName = this.formgroup.get('fullName')?.value;
    organization.emailID = this.formgroup.get('emailID')?.value;
    organization.designation = this.formgroup.get('designation')?.value;
    organization.password = this.formgroup.get('password')?.value;
    organization.financialYearEnd =
      this.formgroup.get('financialYearEnd')?.value;
    organization.financialYearStart =
      this.formgroup.get('financialYearStart')?.value;
    organization.fromMonth = this.formgroup.get('fromMonth')?.value;
    organization.toMonth = this.formgroup.get('toMonth')?.value;
    organization.noofBranches = this.formgroup.get('noofBranches')?.value;
    organization.roleId = this.formgroup.get('roleId')?.value;
    if (organization.id == 0 || organization.id == null) {
      organization.id = 0;
      organization.uid = null;
    }
    if (this.currentApprovalRecord) {
      organization.approvalUID = this.currentApprovalRecord.uid!;
    }
    if (this.isEditMode) {
      if (this.compareOrganizations(this.organizationList, organization)) {
        organization.status = this.organizationList.statusId;
        organization.id = this.organizationList.id;
        organization.uid = this.organizationList.uid;
        organization.modifiedBy = this.persistance.getUserId()!;
        organization.managerId = this.organizationList.managerId;
        if (this.isClearForm) organization.id = 0;
        this.organizationService.postOrganization(organization).subscribe(
          (result: OrganizationModel) => {
            if (result) {
              this.notifier.notify('success', 'Sent for Approval');
              this.organizationService.setOrgAddOrUpdate();
              this.reloaddata.emit('reload');
              this.formgroup.reset();
            } else {
              this.notifier.notify('error', 'Something went wrong');
            }
          },
          (error) => {
            this.notifier.notify('error', 'Something went wrong');
          }
        );
      }
    } else {
      this.organizationService.postOrganization(organization).subscribe(
        (result: OrganizationModel) => {
          if (result) {
            this.notifier.notify(
              'success',
              'Organization Inserted Successfully'
            );
            this.organizationService.setOrgAddOrUpdate();
            this.reloaddata.emit('reload');
            this.formgroup.reset();
          } else {
            this.notifier.notify('error', 'Something went wrong');
          }
        },
        (error) => {
          this.notifier.notify('error', 'Something went wrong');
        }
      );
    }
  }
  // }

  close(): void {
    this.modal.hide();
  }

  onCountrySelect(country: any) {
    this.selectedCountryList.push(country);
    //this.getStateById(country);
  }
  onCountryDeSelect(country: any) {
    this.selectedCountryList = this.selectedCountryList.filter(
      (c) => c.id !== country.id
    );
    //this.getStateById(country);
  }
  onSelectAllCountries(country: any) {
    this.selectedCountryList.push(country);
    console.log('onSelectAll', country);
  }

  compareOrganizations(
    obj1: OrganizationModel,
    obj2: OrganizationModel
  ): boolean {
    const keys = Object.keys(obj1) as (keyof OrganizationModel)[];

    for (let key of keys) {
      if (obj1[key] !== obj2[key]) {
        return true;
      }
    }
    return false;
  }
  getEndYear(evt: any) {
    const year = evt.target.value;
    var entity: EntityModel = { ...this.formgroup.value };
    var month = entity.fromMonth;
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthIndex = months.indexOf(month!);
    if (monthIndex === -1) {
      throw new Error('Invalid month name');
    }
    const date = new Date(year, monthIndex, 1);
    var fyMonth = date.getMonth() + 1;
    const nextYear = fyMonth === 1 ? year : +year + 1;
    this.formgroup.patchValue({
      financialYearEnd: nextYear.toString(),
    });
  }

  getYears() {
    let baseYear = 2000;
    let currentYear = new Date().getFullYear();
    for (var i = baseYear; i <= currentYear; i++) {
      this.years.push({ id: i, year: i });
    }
    return this.years;
  }
  getStartAndEndMonths(countryId: any) {
    this.entityService
      .getStartAndEndMonthsByCountryId(countryId)
      .subscribe((res: Months[]) => {
        this.months = res;
        this.formgroup.patchValue({
          fromMonth: this.months.fromMonth,
          toMonth: this.months.toMonth,
        });
      });
  }

  GetMinorIndustrybyMajorID() {
    let majorIndustryId = this.formgroup.get('majorIndustry')?.value;
    this.organizationService
      .GetMinorIndustrybyMajorID(majorIndustryId)
      .subscribe((result: any[]) => {
        this.majorMinorMapping = result;
        if (this.majorMinorMapping.length > 1) {
          this.selectedMajorIndustries.push(
            this.majorMinorMapping[0].minorIndustryName!
          );
        }
        // this.formgroup!.patchValue({
        //   minorIndustry: this.entityModel!.minorIndustryId,
        // });
      });
  }
}

function clearForm() {
  throw new Error('Function not implemented.');
}
