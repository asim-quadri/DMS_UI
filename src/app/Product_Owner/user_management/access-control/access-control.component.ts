import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NotifierService } from 'angular-notifier';
import { UsersModel } from 'src/app/Models/Users';
import { accessModel, pendingApproval } from 'src/app/Models/pendingapproval';
import { Products } from 'src/app/Models/products';
import { ApiService } from 'src/app/Services/api.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { helperProducts } from 'src/app/enums/enums';
import { MenuOptionModel } from 'src/app/Models/Users';
import { CountryModel } from 'src/app/Models/countryModel';
import { StatesModel } from 'src/app/Models/countryModel';
import { SetUserAccessModel } from 'src/app/Models/SetUserAccessModel';
import { SetUserCountriesModel } from 'src/app/Models/SetUserCountriesModel';
import { UserStateMappingModel } from 'src/app/Models/SetUserCountriesModel';
import { UserStateMappingResponse } from 'src/app/Models/SetUserCountriesModel';
import { CountryService } from 'src/app/Services/country.service';
import { Constant } from 'src/app/@core/utils/constant';
import { OrganizationDetail } from 'src/app/Models/organizationModel';
import { OrganizationService } from 'src/app/Services/organization.service';
import { id } from 'date-fns/locale';
import { count } from 'rxjs';
import { EntityModel } from 'src/app/Models/entityModel';
import { EntityService } from 'src/app/Services/entity.service';
import { RegSetupComplianceModel } from 'src/app/Models/regulationsetupModel';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { ComplianceTypeRegulationSetupModel, PostRegulationGroupModel, RegulationGroupModel } from 'src/app/Models/regulationGroupModel';
import { RegulationGroupService } from 'src/app/Services/regulation.service';
import { CompliancetrackerService } from 'src/app/Services/compliancetracker.service';
import { ListItem } from 'ng-multiselect-dropdown/multiselect.model';

interface CountryState {
  countryName: number | string | null;
  // countryId: number;
  stateId: number | null;
  stateName: string | null;
}



@Component({
  selector: 'app-access-control',
  templateUrl: './access-control.component.html',
  styleUrls: ['./access-control.component.scss'],
})
export class AccessControlComponent implements OnInit {
  onServiceRequestOptionChange(index: number) {
    if (index === 1 && this.serviceRequestOptions[1].canView) {
      this.serviceRequestOptions[0].canView = true;
    }
    if (index === 0 && !this.serviceRequestOptions[0].canView) {
      this.serviceRequestOptions[1].canView = false;
    }
  }
  onStateForRegulationSelect($event: ListItem) {
    console.log(this.selectedComplianceType)
  }
  active = 1;
  menuOptions: MenuOptionModel[] = [];
  regulationMenuOptions: MenuOptionModel[] = [];
  userManagementOptions: MenuOptionModel[] = [];
  homeOptions: MenuOptionModel[] = [];
  announcementOptions: MenuOptionModel[] = [];
  serviceRequestOptions: MenuOptionModel[] = [];
  organizationMenuOptions: MenuOptionModel[] = [];
  countries: CountryModel[] = [];
  regulations: RegSetupComplianceModel[] = [];
  userMappedCountries: CountryModel[] = [];
  userMappedCountryIds: number[] = [];
  selectedCountry: string | null = null;
  stateList: StatesModel[] = [];
  selectedStates: StatesModel[] = [];
  selectedState: string | null = null;
  countryStateChips: CountryState[] = [];
  selectedCountries: { id: number, countryName: string }[] = [];
  accessCountries: { id: number, countryName: string }[] = [];
  selectedOrgList: any[] = [];
  selectedOrgListForEntities: any[] = [];
  homeSuccessMsg = 'Home Screen Access updated successfully';
  homeErrorMsg = 'Failed to update Home Screen access';
  announcementSuccessMsg = 'Announcement Access updated successfully';
  announcementErrorMsg = 'Failed to update Announcement access';
  serviceRequestSuccessMsg = 'Service Request Screen Access updated successfully';
  serviceRequestErrorMsg = 'Failed to update Service Request Screen access';
  userManagementSuccessMsg = 'User Management Access updated successfully';
  userManagementErrorMsg = 'Failed to update User Management Access';
  @Input()
  modal: any;

  @Input()
  user: UsersModel = {};

  @Input()
  pendingProductAccess: pendingApproval | undefined = {};

  @Output()
  reloadPage: EventEmitter<any> = new EventEmitter<any>();

  access: accessModel | undefined;
  products: Products[] = [];

  accessList: accessModel[] = [];

  isReveiw: boolean = false;
  selectAllChecked = false;

  formgroup: FormGroup = this.fb.group({
    roleScreen: [false],
    Userscreen: [false],
    accessControl: [false],
    mapScreen: [false],
    listScreen: [false],
    uid: [''],
  });
  selectedCountryList: any[] = [];




  //model for country
  selectedCountriesForRegulation: { id: number, countryName: string }[] = [];;
  //model for regulation
  selectedRegulation: { id: number, regulationName: string }[] = [];;

  //model for state
  selectedStatesForRegulation: { stateIdCountryId: number, stateName: string }[] = [];;
  //Selected model compliance
  selectedCompliance: { complianceIdRegulationId: number, complianceName: string }[] = [];;
  //selected compliance type model
  selectedComplianceType: { complianceTypeIdComplianceIdRegulationId: number, typeOfComplianceName: string }[] = [];;

  selectedRegulationGroup: { id: number, regulationGroupName: string }[] = [];;

  constructor(
    public apiService: ApiService,
    private fb: FormBuilder,
    private persistance: PersistenceService,
    private notifier: NotifierService,
    private countryService: CountryService,
    private organizationService: OrganizationService,
    private entityService: EntityService,
    private regulationSetupService: RegulationSetupService,
    private regulationGroupService: RegulationGroupService,
    private compliancetrackerService: CompliancetrackerService
  ) { }

  public addMapping = {
    orgDD: {
      singleSelection: false, // Set to false for multiple selection
      idField: 'id',
      textField: 'organizationName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      data: [] as any,
      organizations: [] as CountryModel[],
    },
    isLoaded: true,
    isSubmit: false,
  };
  public orgCountry = {
    countryDD: {
      singleSelection: false,
      idField: 'id',
      textField: 'countryName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      data: [] as any,
      countries: [] as CountryModel[]
    }
  };
  public entityMapping = {
    entityDD: {
      singleSelection: false,
      idField: 'id',
      textField: 'entityName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      data: [] as any,
      countries: [] as EntityModel[]
    }
  };

  public stateMapping = {
    stateDD: {
      singleSelection: false,
      idField: 'stateIdCountryId',
      textField: 'stateName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      countryId: null,
      data: [] as any,
      states: [] as StatesModel[]
    }
  };

  //compliance mapping
  public complianceMapping = {
    complianceDD: {
      singleSelection: false,
      idField: 'complianceIdRegulationId',
      textField: 'complianceName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      regulationSetupId: null,
      data: [] as any,
      complianceTypes: [] as RegSetupComplianceModel[]
    }
  };
  public ComplianceTypeMapping = {
    regulationGroupDD: {
      singleSelection: false,
      idField: 'complianceTypeIdComplianceIdRegulationId',
      textField: 'typeOfComplianceName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      data: [] as any,
      complianceTypes: [] as ComplianceTypeRegulationSetupModel[]
    }
  };
  public regulationMapping = {
    regulationDD: {
      singleSelection: false,
      idField: 'id',
      textField: 'regulationName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      data: [] as any,
      regulations: [] as RegSetupComplianceModel[]
    }
  };

  public regulationGroupMapping = {
    regulationGroupDD: {
      singleSelection: false,
      idField: 'id',
      textField: 'regulationGroupName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      data: [] as any,
      regulationGroups: [] as RegulationGroupModel[]
    }
  };

  public compliancesMapping = {
    complianceDD: {
      singleSelection: false,
      idField: 'id',
      textField: 'complianceName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      data: [] as any,
      complianceTypes: [] as RegSetupComplianceModel[]
    }
  };





  ngOnInit(): void {
    this.isReveiw = false;
    this.getAccessList();
    this.getProducts();
    //get menu options for product setup screen
    this.getMenuOptionsForProductSetup();
    //get menu options for organization
    this.getMenuOptionsForOrganization();
    //get menu options for home tab
    this.getMenuOptionsForHome();
    // Announcements tab uses static array
    //get menu options for service request tab
    this.getMenuOptionsForServiceRequest();

    this.getMenuOptionsForAnnouncements();

    //get countries for dropdown
    this.getCountries();
    //get user mapped states
    this.getUserMappedStates();
    //get organizations for dropdown
    this.getOrganizations();

    //get selected organizations
    this.getSelectedOrganizations();

    //get regulations for dropdown
    this.getRegulations();

    //get regulation groups for dropdown
    this.getRegulationGroups();

    //get compliances for dropdown
    this.getCompliances();



    // this.getComplianceMapping();
    this.getUserRegulationMapping();

  }

  getUserRegulationMapping() {
    const userId = this.user.id;
    this.compliancetrackerService.getUserRegulationMapping(userId).subscribe((result: any) => {
      this.selectedCountriesForRegulation = result?.countries?.map((country: any) => ({ id: Number(country.id), countryName: country.name }));
      this.selectedRegulation = result?.regulations?.map((item: any) => ({ id: Number(item.id), regulationName: item.name }));
      this.selectedStatesForRegulation = result?.states?.map((item: any) => {
        console.log('State ID:', this.countries);
        return { stateIdCountryId: item.id, stateName: item.name }
      });
      this.selectedCompliance = result?.complianceId?.map((item: any) => {
        console.log('Compliance ID:', this.regulations);
        return { complianceIdRegulationId: item.id, complianceName: item.name }
      });
      this.selectedRegulationGroup = result?.regulationGroupName?.map((item: any) => ({ id: Number(item.id), regulationGroupName: item.name }));
      this.selectedComplianceType = result?.complianceType?.map((item: any) => {
        console.log('Compliance type ID:', this.regulations, this.selectedCompliance);
        return { complianceTypeIdComplianceIdRegulationId: Number(item.id), typeOfComplianceName: item.name }
      });
      console.log('Compliance Mapping:', result);
      this.selectedCountriesForRegulation &&
        this.selectedCountriesForRegulation.forEach(item =>
          this.onCountryForRegulationSelect(item));
      this.selectedRegulation && this.selectedRegulation.forEach(item =>
        this.onRegulationSelect(item));
    });
  }

  postUserRegulationMapping() {
    const userId = this.user.id ?? 0;
    const payload: PostRegulationGroupModel = {
      userId: userId,
      countryIds: (this.selectedCountriesForRegulation ?? []).map(country => country.id).join(','),
      stateIds: (this.selectedStatesForRegulation ?? []).map(state => String(state.stateIdCountryId).split('-')[0]).join(','),
      regulationIds: (this.selectedRegulation ?? []).map(reg => reg.id).join(','),
      regulationGroupId: (this.selectedRegulationGroup ?? []).map(reg => reg.id).join(','),
      complianceType: (this.selectedComplianceType ?? []).map(type => String(type.complianceTypeIdComplianceIdRegulationId).split('-')[0]).join(','),
      complianceId: (this.selectedCompliance ?? []).map(compliance => String(compliance.complianceIdRegulationId).split('-')[0]).join(','),
    }
    this.compliancetrackerService.postUserRegulationGroupMapping(payload).subscribe((result: any) => {
      console.log('User Regulation Mapping:', result);
      if (result) {
        this.notifier.notify('success', 'Created User Regulation Mapping successfully');
      } else {
        this.notifier.notify('error', 'Failed to create User Regulation Mapping');
      }
    });
  }

  updateSelectAllChecked() {
    this.selectAllChecked = this.menuOptions.every(option => option.canView);
  }

  getMenuOptionsForProductSetup() {
    // Fetch menu options for product setup screen
    this.apiService.getMenuOptionsByParentId(2, this.user.id!).subscribe((result: MenuOptionModel[]) => {
      this.menuOptions = result;
      //check if all options are selected
      this.updateSelectAllChecked();
      // fetch user management options
      this.apiService.getMenuOptionsByParentId(5, this.user.id!).subscribe((result: MenuOptionModel[]) => {
        this.userManagementOptions = result;
      });
      this.apiService.getMenuOptionsByParentId(14, this.user.id!).subscribe((result: MenuOptionModel[]) => {
        this.regulationMenuOptions = result;
        const idsToRemove = [64, 36, 52, 53, 54, 55, 56]; // replace with the ids you want to remove
        this.regulationMenuOptions = this.regulationMenuOptions.filter(option => !idsToRemove.includes(option.id));


      });
    });
  }

  getMenuOptionsForOrganization() {
    // Fetch menu options for organization
    this.apiService.getMenuOptionsByParentId(3, this.user.id!).subscribe((result: MenuOptionModel[]) => {
      //remove view screen from menu options
      this.organizationMenuOptions = result.filter(option => option.title !== 'View Screen');
    });
  }

  getMenuOptionsForHome() {
    // Fetch menu options for home tab (parentId = 1 assumed for Home)
    this.apiService.getMenuOptionsByParentId(1, this.user.id!).subscribe((result: MenuOptionModel[]) => {
      this.homeOptions = result;
    });
  }
  getMenuOptionsForAnnouncements() {
    // Fetch menu options for announcements tab (parentId = 4 assumed for Announcements)
    this.apiService.getMenuOptionsByParentId(4, this.user.id!).subscribe((result: MenuOptionModel[]) => {
      this.announcementOptions = result;
    });
  }

  getMenuOptionsForServiceRequest() {
    // Fetch menu options for service request tab (parentId = 6 assumed for Service Request)
    this.apiService.getMenuOptionsByParentId(6, this.user.id!).subscribe((result: MenuOptionModel[]) => {
      this.serviceRequestOptions = result;
    });
  }

  getCountries() {
    const userId = this.persistance.getUserId()!
    this.countryService.getAllCountryMaster(userId).subscribe((result: any) => {
      this.countries = result;
      this.orgCountry.countryDD.data = result.map((country: CountryModel) => {
        return {
          id: country.id,
          countryName: country.countryName
        };
      });

      // Fetch user mapping (replace with your actual API/service call)
      this.countryService.getAllCountryMaster(this.user.id!).subscribe((mappedIds: any) => {
        this.userMappedCountries = mappedIds;
        //get ids from mapped countries
        this.userMappedCountryIds = mappedIds.map((country: CountryModel) => country.id);

        // Set pre-selected countries
        this.selectedCountries = mappedIds.map((country: CountryModel) => ({ id: country.id, countryName: country.countryName }));
        this.accessCountries = mappedIds.map((country: CountryModel) => ({ id: country.id, countryName: country.countryName }));
        console.log('User Mapped Countries:', this.selectedCountries);
      });
    });
  }

  getRegulations() {
    this.regulationSetupService.getRegulationSetupHistory().subscribe((result: any) => {
      this.regulations = result;
      this.regulationMapping.regulationDD.data = result.map((regulation: RegSetupComplianceModel) => {
        return {
          id: regulation.id,
          regulationName: regulation.regulationName
        };
      });
      console.log('Regulations:', this.regulationMapping.regulationDD.data);
    });
  }

  getRegulationGroups() {
    this.regulationGroupService.getAllRegulationGroups().subscribe((result: any) => {
      this.regulationGroupMapping.regulationGroupDD.data = result.map((group: RegulationGroupModel) => {
        return {
          id: group.id,
          regulationGroupName: group.regulationGroupName
        };
      });
      console.log('Regulation Groups:', this.regulationGroupMapping.regulationGroupDD.data);
    });
  }

  getCompliances() {
    this.compliancetrackerService.getAllCompliances().subscribe((result: any) => {
      this.compliancesMapping.complianceDD.data = result.map((compliance: RegSetupComplianceModel) => {
        return {
          id: compliance.id,
          complianceName: compliance.complianceName
        };
      });
      console.log('Compliances:', this.compliancesMapping.complianceDD.data);
    });
  }

  getSelectedOrganizations() {
    this.organizationService.getOrganizationsByUserId(this.user.id!).subscribe((result: any) => {
      this.selectedOrgList = result.map((organization: any) => {
        return {
          ...organization,
          id: organization.id,
          organizationName: organization.organizationName
        };
      });
      console.log('selected Organizations:', this.selectedOrgList);
    });
  }



  onOrgSelect(organization: any) {
    this.selectedOrgList.push(organization);
    //this.getStateById(country);
  }

  onOrganizationsForEntitySelect(organization: any) {
    this.selectedOrgListForEntities.push(organization);
    console.log('Selected Organization for Entities:', organization);
    //get entities for selected organization
    this.entityService.GetEntitiesByOrganizationId(organization.id).subscribe((entities: any[]) => {
      console.log('Entities for selected organization:', entities);
      this.entityMapping.entityDD.data = entities.map((entity: any) => {
        return {
          id: entity.id,
          entityName: entity.entityName
        };
      });
    });
    console.log('Entities for selected organization:', this.entityMapping.entityDD.data);

  }

  onOrgDeSelect(organization: any) {
    this.selectedOrgList = this.selectedOrgList.filter(
      (o) => o.id !== organization.id
    );
    //this.getStateById(country);
  }

  onSelectAllOrganizations(organization: any) {
    this.selectedOrgList.push(organization);
    console.log('onSelectAll', organization);
  }

  onCountrySelect(country: any) {
    this.selectedCountryList.push(country);
    this.getStateById(country);
  }

  //on select country for regulation
  onCountryForRegulationSelect(country: any) {
    console.log(this.selectedCountriesForRegulation)
    this.countryService.getSateById(country.id, this.persistance.getUserId()).subscribe((result: any) => {
      if (Array.isArray(result)) {
        this.stateMapping.stateDD.data = [
          ...this.stateMapping.stateDD.data,
          ...result.map((state: StatesModel) => ({
            id: state.id,
            stateName: state.stateName,
            stateIdCountryId: `${state.id}-${country.id}`
          }))
        ];
      }
    });
  }

  //on select regulation
  onRegulationSelect(regulation: any) {
    console.log('compliance', this.selectedRegulation)
    this.compliancetrackerService.getComplianceByRegulationId(regulation.id).subscribe((result: any) => {
      if (Array.isArray(result)) {
        this.complianceMapping.complianceDD.data = [
          ...this.complianceMapping.complianceDD.data,
          ...result.map((compliance: RegSetupComplianceModel) => ({
            id: compliance.id,
            complianceName: compliance.complianceName,
            complianceIdRegulationId: `${compliance.id}-${regulation.id}`
          }))
        ];
      }
    });
    this.compliancetrackerService.getComplianceTypeByRegulationSetupId(regulation.id).subscribe((result: any) => {
      if (Array.isArray(result)) {
        this.ComplianceTypeMapping.regulationGroupDD.data = [
          ...this.ComplianceTypeMapping.regulationGroupDD.data,
          ...result.map((compliance: ComplianceTypeRegulationSetupModel) => ({
            id: compliance.id,
            regulationSetupId: compliance.regulationSetupId,
            complianceId: compliance.complianceId,
            typeOfComplianceName: compliance.typeOfComplianceName,
            complianceTypeIdComplianceIdRegulationId: `${compliance.id}-${compliance.complianceId}-${compliance.regulationSetupId}`,
          }))
        ];
      }
    });
  }

  onComplianceRegulationSelect(regulation: any) {
    console.log('compliance', this.selectedRegulation, this.selectedCompliance)
    const [complianceId, regulationId] = regulation.complianceIdRegulationId.split('-');
    this.compliancetrackerService.getComplianceTypeByRegulationSetupId(regulationId, complianceId).subscribe((result: any) => {
      if (Array.isArray(result)) {
        this.ComplianceTypeMapping.regulationGroupDD.data = [
          ...this.ComplianceTypeMapping.regulationGroupDD.data,
          ...result.map((compliance: ComplianceTypeRegulationSetupModel) => ({
            id: compliance.id,
            regulationSetupId: compliance.regulationSetupId,
            complianceId: compliance.complianceId,
            typeOfComplianceName: compliance.typeOfComplianceName,
            complianceTypeIdComplianceIdRegulationId: `${compliance.id}-${compliance.complianceId}-${compliance.regulationSetupId}`,
          }))
        ];
      }
    });
  }

  // on de select country
  onRegulationCountryDeSelect(event: ListItem) {
    this.selectedStatesForRegulation = this.selectedStatesForRegulation.filter(item => String(item.stateIdCountryId) !== String(event.id));
    this.stateMapping.stateDD.data = this.stateMapping.stateDD.data.filter(
      (item: { stateIdCountryId: string; }) => item.stateIdCountryId.split('-')[1] !== String(event.id));
  }

  // on de select regulation
  onRegulationDeSelect(event: ListItem) {
    this.selectedCompliance = this.selectedCompliance.filter(item => String(item.complianceIdRegulationId) !== String(event.id));
    this.complianceMapping.complianceDD.data = this.complianceMapping.complianceDD.data.filter(
      (item: { id: string; }) => item.id.split('-')[1] !== String(event.id));
    this.selectedComplianceType = this.selectedComplianceType.filter(item => String(item.complianceTypeIdComplianceIdRegulationId) !== String(event.id));
    this.ComplianceTypeMapping.regulationGroupDD.data = this.ComplianceTypeMapping.regulationGroupDD.data.filter(
      (item: { regulationSetupId: string; }) => item.regulationSetupId.split('-')[2] !== String(event.id));
  }

  onComplianceDeSelect(event: ListItem) {
    this.selectedComplianceType = this.selectedComplianceType.filter(item => String(item.complianceTypeIdComplianceIdRegulationId) !== String(event.id));
    this.ComplianceTypeMapping.regulationGroupDD.data = this.ComplianceTypeMapping.regulationGroupDD.data.filter(
      (item: { id: string; }) => item.id.split('-')[0] !== String(event.id));
  }



  onCountryDeSelect(country: any) {
    this.selectedCountryList = this.selectedCountryList.filter(
      (c) => c.id !== country.id
    );
    this.selectedStatesForRegulation = this.selectedStatesForRegulation.filter(
      (s) => s.stateIdCountryId !== country.id
    );
    //this.getStateById(country);
  }
  onSelectAllCountries(country: any) {
    this.selectedCountryList.push(country);
    console.log('onSelectAll', country);
  }

  onSelectAllCountriesForRegulation(countries: any) {
    this.selectedCountriesForRegulation = countries;
  }

  getUserMappedStates() {
    this.countryService.getUserMappedStates(this.user.id!).subscribe((result: UserStateMappingResponse[]) => {
      this.countryStateChips = result.map(item => ({
        countryName: item.countryId,
        stateName: item.stateName,
        stateId: item.stateId
      }));
    });
    console.log(this.countryStateChips);
  }
  getAccessList() {
    if (this.pendingProductAccess?.review) {
      this.isReveiw = true;
    }
    this.products = [];
    this.apiService
      .getAccessList(this.pendingProductAccess?.userUID!)
      .subscribe((result: accessModel[]) => {
        this.accessList = result;
        if (this.accessList.length > 0) {
          this.bindData();
        }
      });
  }

  getOrganizations() {
    this.organizationService.getOrganizationsByUserId(this.persistance.getUserId()!).subscribe((result: any) => {
      this.addMapping.orgDD.data = result.map((organization: any) => {
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
          id: organization.id,
          organizationName: organization.organizationName,

        };
      });
      console.log('Organizations:', this.addMapping.orgDD.data);
    });
  }

  bindData() {
    this.formgroup.patchValue({
      roleScreen: this.accessList.find(
        (f) => f.productName == helperProducts.roleScreen
      )?.enable,
      Userscreen: this.accessList.find(
        (f) => f.productName == helperProducts.userScreen
      )?.enable,
      accessControl: this.accessList.find(
        (f) => f.productName == helperProducts.accessControlScreen
      )?.enable,
    });
  }

  getProducts() {
    this.products = [];
    this.apiService.getAllUsers().subscribe((result: any) => {
      this.products = result;
    });
  }


  submitScreenAccess(options: MenuOptionModel[], successMessage: string, errorMessage: string) {
    const accessData: SetUserAccessModel[] = options
      .filter(option => option.id != null && option.title != null)
      .map(option => ({
        userId: this.user.id!,
        menuId: option.id,
        hasAccess: !!option.canView
      }));
    this.apiService.setUserAccess(accessData).subscribe((result: any) => {
      if (result) {
        this.notifier.notify('success', successMessage);
        this.reloadPage.emit('close');
        this.modal.hide();
      } else {
        this.notifier.notify('error', errorMessage);
      }
    });
  }
  
  onSelectAllChange() {
    this.menuOptions.forEach(option => option.canView = this.selectAllChecked);
  }

  next() {
    this.active++;
  }

  onCountryDropdownFocus() {
    //get user mapped countries from selected countries
    this.userMappedCountries = this.countries.filter(country =>
      this.selectedCountries.find(selected => selected.id === country.id)
    );
  }

  onCountryChanged(event: any) {
    this.getStateById(this.selectedCountry);
  }

  onStateSelected(event: any) {
    console.log('Selected State:', this.selectedState);
    // Add selected state to selectedStates array if not already present
    //this.selectedStates = this.selectedStates.filter(state => state.id !== this.selectedState);
    if (this.selectedState && this.selectedCountry) {
      const selectedStateObj = this.stateList.find(state => state.id === Number(this.selectedState));
      if (selectedStateObj) {
        // Check if the same state name already exists for the selected country
        const exists = this.countryStateChips.some(
          chip =>
            chip.countryName === this.selectedCountry &&
            chip.stateName === selectedStateObj.stateName
        );
        if (!exists) {
          this.countryStateChips.push({
            countryName: this.selectedCountry !== null ? this.selectedCountry : '',
            stateName: selectedStateObj.stateName,
            stateId: selectedStateObj.id
          });
        }
      }
    }
  }
  remove(countryStateChip: CountryState) {
    console.log('Removing country state chip:', countryStateChip);
    // Remove the chip from the array
    this.countryStateChips = this.countryStateChips.filter(chip => chip !== countryStateChip);
  }

  getStateById(countryId: any) {
    this.countryService.getSateById(countryId, this.persistance.getUserId()).subscribe((result: any) => {
      this.stateList = result;
    });
  }

  removeState(state: StatesModel) {
    console.log('Removing state:', state);
  }

  saveOrgAccess() {

    // create SetUserAccessModel array, filter out options without id or title if needed
    const accessData: SetUserAccessModel[] = this.organizationMenuOptions
      .filter(option => option.id != null && option.title != null)
      .map(option => ({
        userId: this.user.id!,
        menuId: option.id,
        hasAccess: !!option.canView
      }));


    // get selected organizations
    const selectedOrganizations = this.selectedOrgList.filter(org => org.id != null);
    console.log('Selected Organizations:', selectedOrganizations);
    const setUserOrganizationModel = selectedOrganizations.map(org => ({
      userId: this.user.id!,
      organizationId: org.id,
      hasAccess: true // set access as true for selected organizations
    }));

    // call API to save organization access data
    this.apiService.setUserAccess(accessData).subscribe((result: any) => {
      if (result) {
        this.notifier.notify('success', 'Organization Access updated successfully');
      } else {
        this.notifier.notify('error', 'Failed to update organization access');
      }
    });

    // call API to save organization access
    this.apiService.setUserOrganizations(setUserOrganizationModel).subscribe((result: any) => {
      if (result) {
        this.notifier.notify('success', 'Organizations updated successfully');
        this.reloadPage.emit('close');
      } else {
        this.notifier.notify('error', 'Failed to update organizations');
      }
    });
  }

  onSave() {
    // get selected menu options
    const selectedMenuOptions = this.menuOptions;
    // add regulation menu options to selected menu options
    selectedMenuOptions.push(...this.regulationMenuOptions);
    // create SetUserAccessModel array, filter out options without id or title if needed
    const accessData: SetUserAccessModel[] = selectedMenuOptions
      .filter(option => option.id != null && option.title != null)
      .map(option => ({
        userId: this.user.id!,
        menuId: option.id,
        hasAccess: !!option.canView
      }));

    if (this.selectedCountriesForRegulation.length !== 0) {
      accessData.push({
        userId: this.user.id!,
        menuId: 13, // 13 is the ID for regulation access
        hasAccess: true // Set access as true for regulation access
      });
    }

    //get selected countries
    this.selectedCountries = this.selectedCountries.filter(id => id != null);
    console.log('Selected Countries:', this.selectedCountries);
    // compare with userMappedCountryIds and create exclude list
    const excludedCountries = this.userMappedCountryIds.filter(id => !this.selectedCountries.find(country => country.id === id));
    console.log('Excluded Countries:', excludedCountries);

    // create SetUserCountriesModel array
    const countryData: SetUserCountriesModel[] = this.selectedCountries.map(countryId => ({
      userId: this.user.id!,
      countryId: countryId.id,
      hasAccess: true // set access as true for selected countries
    }));

    // add excluded countries to countryData
    excludedCountries.forEach(countryId => {
      countryData.push({
        userId: this.user.id!,
        countryId: countryId,
        hasAccess: false // set access as false for excluded countries
      });
    });
    //Add user regulation mapping
    this.postUserRegulationMapping();
    // create UserStateMappingModel array using countryStateChips
    const userStateMapping: UserStateMappingModel[] = this.countryStateChips.map(chip => ({
      userId: this.user.id!,
      stateId: chip.stateId!,
      hasAccess: true // set access as true for selected states
    }));

    //call API to save country access data
    this.countryService.setUserCountries(countryData).subscribe((result: any) => {
      if (result) {
        this.notifier.notify('success', 'Countries updated successfully');
      } else {
        this.notifier.notify('error', 'Failed to update countries');
      }
    });
    // call API to save user state mapping
    this.countryService.setUserStates(userStateMapping).subscribe((result: any) => {
      if (result) {
        this.notifier.notify('success', 'States updated successfully');
      } else {
        this.notifier.notify('error', 'Failed to update states');
      }
    });
    // call API to save access data
    this.apiService.setUserAccess(accessData).subscribe((result: any) => {
      if (result) {
        this.notifier.notify('success', 'Access updated successfully');
        //this.reloadPage.emit('close');
        console.log(this.modal);
        //this.modal.hide();
        this.modal.dismiss('Cross click')
      } else {
        this.notifier.notify('error', 'Failed to update access');
      }
    });
  }

  bindAccessData() {
    this.access = {
      userId: this.user?.id!,
      userUID: this.persistance!.getUserUID()!,
      managerId: this.pendingProductAccess?.approverManager!,
      productMappingId: this.pendingProductAccess?.productMappingId!,
      ApprovalTypeId: this.pendingProductAccess?.approvalTypeId!,
      uid: this.pendingProductAccess?.approverUID!,
      createdBy: this.persistance.getUserId()!,
    };
  }

  approve() {
    this.bindAccessData();
    this.apiService
      .submitProductApproved(this.access!)
      .subscribe((result: any) => {
        if (result) {
          this.notifier.notify('success', 'Updated Successfully');
          this.reloadPage.emit('close');
        } else {
          this.notifier.notify('error', 'Some Thing went wrong');
        }
      });
  }

  reject() {
    this.bindAccessData();
    this.apiService
      .submitProductReject(this.access!)
      .subscribe((result: any) => {
        if (result) {
          this.notifier.notify('success', 'Updated Successfully');
          this.reloadPage.emit('close');
        } else {
          this.notifier.notify('error', 'Some Thing went wrong');
        }
      });
  }
}
