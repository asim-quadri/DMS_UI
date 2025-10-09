import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { OrganizationCountryModel, OrganizationModel } from '../../../models/organizationModel';
import { OrganizationService } from '../../../Services/organization.service';
import { PersistenceService } from '../../../Services/persistence.service';
import { CountryService } from '../../../Services/country.service';
import { CountryModel, CountryStateMapping, StatesModel } from '../../../models/countryModel';
import { Constant } from '../../../@core/utils/constant';
import { BillingLevelModel } from '../../../models/billingLevelModel';
import { ProductTypeModel } from '../../../models/productTypeModel';
import { IndustryMapping, MajorIndustryModel, MinorIndustrypModel } from '../../../models/industrysetupModel';
import { IndustryService } from '../../../Services/industry.service';
import { of, switchMap } from 'rxjs';
import { EntityTypeModel } from '../../../models/entityTypeModel';
import { EntityTypeService } from '../../../Services/entityType.service';
import { Router } from '@angular/router';

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
  countryStateMapping: CountryStateMapping[] = [];
  selectedCountries: string[] = [];
  stateList: StatesModel[] = [];
  selectedStateList: any[] = [];
  selectedCountryList: any[] = [];
  majorindustry = [];
	minorindustry: MinorIndustrypModel[] = [];
  selectedMajorIndustryList: MajorIndustryModel[] = [];
  selectedMinorIndustryList: MinorIndustrypModel[] = [];
  organizationCountry : OrganizationCountryModel[] = [];
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
  selectedCountryValue:string = '';
  selectedStateValue:string='';


  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

   constructor(
    private fb: FormBuilder,
    public countryService: CountryService,
    public organizationService: OrganizationService,
    private notifier: NotifierService,
    public industryService: IndustryService,
    public entityTypeService: EntityTypeService  ) {
    this.headerLabel = 'Add New Organization';
    this.buttonLabel = 'Add Organization';
    this.formgroup = this.fb.group({
      emailAddress: [['', Validators.required]],
      password: [['', Validators.required]],
      organizationName: ['', Validators.required],
      countryDDId: ['', Validators.required],
      stateId: ['', Validators.required],
      city: ['', Validators.required],
      address: ['', Validators.required],
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
      data: [] as any,
      countries: [] as CountryModel[],
    },
    isLoaded: true,
    isSubmit: false,
  };



  ngOnInit(): void {
    this.isEditMode = false;
    this.isClearForm = false;
    this.getAllCountries();

    this.organizationService.getClearForm().subscribe((res) => {
      if(res)
        this.clearForm();
    });



    //Initialize selected countries if needed
    this.formgroup.patchValue({
      countryId: this.selectedCountries
  });

    this.organizationService.getSelectedOrganization().subscribe((organization) => {
    if (organization) {
      this.organizationList = organization;
      this.isEditMode = true;
      this.isClearForm = false;
      console.log("dataOnChange", organization);
      this.getStateById(organization.countryDDId);
      this.bindFormDatas();
        this.loadData(organization);
      }
    });
  }

    loadData(organization: any){

      console.log("organization Inside LoadData", organization);
       const selectedCountryIds = organization.countryId.split(',').map((id: string) => id.trim());
       const selectedCountries = this.addMapping.countryDD.data.filter((country: any) => selectedCountryIds.includes(country.id.toString()));

      this.formgroup.patchValue({
        organizationName: organization.organizationName,
        countryId: selectedCountries,
        countryDDId: organization.countryDDId,
        emailAddress:"",
        password:"",
        contactNumber:"",
        stateId: organization.stateId,
        city: organization.city,
        address: organization.address,
        pin: organization.pin,
      });
      this.formgroup.updateValueAndValidity();
}
clearForm(): void {
  this.formgroup.reset(); // Reset the form to initial state
  this.isClearForm = true;
}

bindFormDatas() {
  this.getCountries();
  this.getCountrStateMapping();
  // this.getAllBillingLevel();
  // this.getAllProductType();
}

  formgroup: FormGroup = this.fb.group({
    organizationName: ['', [RxwebValidators.required({ message: 'Organization name is required' })]],
      countryDDId: ['', RxwebValidators.required({ message: 'Country is required' })],
      emailAddress: ['', RxwebValidators.required({ message: 'Country is required' })],
      password: ['', RxwebValidators.required({ message: 'Country is required' })],
      stateId: ['', RxwebValidators.required({ message: 'State is required' })],
      city: ['', RxwebValidators.required({ message: 'City is required'})],
      address: ['', RxwebValidators.required({ message: 'Address is required' })],
  });

  getCountries() {
    this.countryService.getAllCountryMaster().subscribe((result: any) => {
      // this.countries = result;
      this.addMapping.countryDD.data = result;  // Update the data for the dropdown
    });
  }

getAllCountries(){
  this.countryService.getAllCountries().subscribe((result: any) => {
    this.countries = result;
  });
}


onCountryChange(event: any) {
  const selectedId = +event.target.value; // Ensure selected ID is a number
  console.log('Selected ID:', selectedId);

  // Find the country based on the selected ID
  const selectedCountry = this.countries.find(country => country.id === selectedId);

  if (selectedCountry) {
      this.selectedCountryValue = selectedCountry.countryName; // Update to country name
      console.log('Selected Country Name:', this.selectedCountryValue);
      // Optionally fetch states or other data using the selected ID
      this.getStateById(selectedId); // Pass the ID if needed for further processing
  } else {
      console.error('Country not found for ID:', selectedId);
  }
}


onStateChange(event: any) {
  const selectedId = +event.target.value;

  const selectedState = this.stateList.find(state => state.id === selectedId);

  if (selectedState) {
      this.selectedStateValue = selectedState.stateName;

  } else {
      console.error('Country not found for ID:', selectedId);
  }

}

  getStateById(countryId: any) {
    console.log("countryId", countryId);
    return this.countryService.getSateById(countryId).pipe(
      switchMap((result: any) => {
        this.formgroup.updateValueAndValidity();
        this.stateList = result;
        // Fetch industry mappings and return as observable
        return this.industryService.getIndustryMapping();
      }),
      switchMap((result: IndustryMapping[]) => {
        this.industryMapping = result;

        // Filter industry mappings based on countryId
        const filteredMappings = this.industryMapping.filter(x => x.countryId?.toString() === countryId?.toString());

        // Map filtered industry mappings to new major industry items
        this.selectedMajorIndustryList = filteredMappings.map(x => ({
          id: x.majorIndustryId !== null ? x.majorIndustryId : 0,
          countryId: Number(x.countryId),
          majorIndustryName: x.majorIndustryName !== null ? x.majorIndustryName : '',
          majorIndustryCode: x.majorIndustryCode !== null ? x.majorIndustryCode : '',
          status: null,
          createdOn: x.createdOn !== undefined ? x.createdOn : null,
          createdBy: x.createdBy !== undefined ? x.createdBy : null,
          modifiedOn: x.modifiedOn !== undefined ? x.modifiedOn : null,
          modifiedBy: x.modifiedBy !== undefined ? x.modifiedBy : null,
          uid: null,
          managerId: x.managerId !== null ? x.managerId : null,
          ApprovalUID: null
        }));

        // Map filtered industry mappings to new minor industry items
        this.selectedMinorIndustryList = filteredMappings.map(x => ({
          id: x.minorIndustryId !== null ? x.minorIndustryId : 0,
          majorIndustryId: x.majorIndustryId !== null ? x.majorIndustryId : 0,
          minorIndustryName: x.minorIndustryName !== null ? x.minorIndustryName : '',
          minorIndustryCode: x.minorIndustryCode !== null ? x.minorIndustryCode : '',
          status: null,
          createdOn: x.createdOn !== undefined ? x.createdOn : null,
          createdBy: x.createdBy !== undefined ? x.createdBy : null,
          modifiedOn: x.modifiedOn !== undefined ? x.modifiedOn : null,
          modifiedBy: x.modifiedBy !== undefined ? x.modifiedBy : null,
          uid: null,
          managerId: x.managerId !== null ? x.managerId : null,
          ApprovalUID: null
        }));

        // Fetch industry mappings and return as observable
       return this.entityTypeService.getCountryEntityTypeMapping();
      //  return of('done');
      }),
      switchMap((result: EntityTypeModel[]) => {

        this.countryEntityTypeMapping = result;

        // Filter industry mappings based on countryId
        const filteredMappings = this.countryEntityTypeMapping.filter(x => x.countryId?.toString() === countryId?.toString());

        // Map filtered industry mappings to new minor industry items
        this.selectedEntityList = filteredMappings.map(x => ({
          id: x.id !== undefined ? x.id : 0,
          entityTypeId: x.entityTypeId !== undefined ? x.entityTypeId : 0,
          countryId: Number(x.countryId) !== undefined ? Number(x.countryId) : 0,
          countryName: x.countryName !== undefined ? x.countryName : null,
          managerId: x.managerId !== undefined ? x.managerId : 0,
          entityType: x.entityType !== undefined ? x.entityType : null,
          entityTypeCode: x.entityTypeCode !== undefined ? x.entityTypeCode : null,
          countryEntityTypeMappingId: x.countryEntityTypeMappingId !== undefined ? x.countryEntityTypeMappingId : 0,
          approvalStatus: x.approvalStatus !== undefined ? x.approvalStatus : null,
          fullName: x.fullName !== undefined ? x.fullName : null,
          statusId: x.statusId !== undefined ? x.statusId : 0,
          createdOn: x.createdOn !== undefined ? x.createdOn : null,
          createdBy: x.createdBy !== undefined ? x.createdBy : undefined, // Ensure createdBy is correctly handled
          modifiedOn: x.modifiedOn !== undefined ? x.modifiedOn : null,
          modifiedBy: x.modifiedBy !== undefined ? x.modifiedBy : 0,
          uid: null,
          hide: x.hide !== undefined ? x.hide : false
        }));

        // Return a dummy observable or use 'of' to fulfill the requirement
        return of('done');
      })
    ).subscribe((result: any) => {
      // You can perform any post-processing logic here if needed
      if(result){
        this.bindFormDatas();
      }
    });
  }

  getCountrStateMapping() {
    this.countryService.getCountryStateMapping().subscribe((result: CountryStateMapping[]) => {
      this.countryStateMapping = result;
      if (this.countryStateMapping.length > 0) {
        this.selectedCountries.push(this.countryStateMapping[0].countryName!);
      }
    });
  }

  getAllBillingLevel(): void {
    this.organizationService.getAllBillingLevel().subscribe((result: any) => {
      this.billingLevel = result;
      console.log("this.billingLevel", this.billingLevel);
    });
  }

  getAllProductType(): void {

    this.organizationService.getAllProductType().subscribe((result: any) => {
      this.typeOfProduct = result;
      console.log("this.typeOfProduct", this.typeOfProduct);
    });
  }

  getBillingLevelById(): void {

  }

  onSubmit() {

    const formValues = { ...this.formgroup.value };


      delete formValues.countryDDId;
      delete formValues.stateId;

    const organization: OrganizationModel = {
        ...formValues,
        id:3,
        country: this.selectedCountryValue,
        state: this.selectedStateValue
    };

    console.log('Organization to Submit:', organization);
        this.organizationService.addOrganization(organization).subscribe((result: OrganizationModel) => {
          console.log("organisation valus == ",organization);
          if (result) {
            this.notifier.notify("success", "Organization added Successfully");
            this.organizationService.setOrgAddOrUpdate();
            // this.reloaddata.emit('reload');
            this.formgroup.reset();
          }
          else {
            this.notifier.notify("error", "Something went wrong");
          }
        }, () => {
          this.notifier.notify("error", "Something went wrong");
        });
  }

}


