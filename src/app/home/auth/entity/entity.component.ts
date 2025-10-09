import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { CountryService } from '../../../Services/country.service';
import { CountryModel, CountryStateMapping, StatesModel } from '../../../models/countryModel';
import { of, switchMap } from 'rxjs';
import { EntityTypeModel } from '../../../models/entityTypeModel';
import { IndustryMapping } from '../../../models/industrysetupModel';
import { OrganizationModel } from '../../../models/organizationModel';
import { EntityTypeService } from '../../../Services/entityType.service';
import { IndustryService } from '../../../Services/industry.service';

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.css']
})
export class EntityComponent implements OnInit {

  selectedCountryValue:string = '';
  selectedStateValue:string='';
  countryStateMapping: CountryStateMapping[] = [];
  selectedCountries: string[] = [];
  stateList: StatesModel[] = [];
  selectedStateList: any[] = [];
  selectedCountryList: any[] = [];
  countries: CountryModel[] = [];
  states: StatesModel[] = [];
  @Input()
  modal: any;
  industryMapping: IndustryMapping[] = [];
  countryEntityTypeMapping: EntityTypeModel[] = [];
  selectedEntityList: EntityTypeModel[] = [];
  selectedEntity: OrganizationModel[] = [];
  constructor(
    private fb: FormBuilder,
    public countryService: CountryService,
    public entityTypeService: EntityTypeService,
    public industryService: IndustryService,


  ) {
    this.formgroup = this.fb.group({
    emailAddress: [['', Validators.required]],
    password: [['', Validators.required]],
    entityName: ['', Validators.required],
    countryDDId: ['', Validators.required],
    stateId: ['', Validators.required],
    city: ['', Validators.required],
    address: ['', Validators.required],
  });
}

  ngOnInit() {
    this.getAllCountries();
    this.getCountrStateMapping();
  }

  formgroup: FormGroup = this.fb.group({
      entityName: ['', [RxwebValidators.required({ message: 'Entity name is required' })]],
      countryDDId: ['', RxwebValidators.required({ message: 'Country is required' })],
      emailAddress: ['', RxwebValidators.required({ message: 'Country is required' })],
      password: ['', RxwebValidators.required({ message: 'Country is required' })],
      stateId: ['', RxwebValidators.required({ message: 'State is required' })],
      city: ['', RxwebValidators.required({ message: 'City is required'})],
      address: ['', RxwebValidators.required({ message: 'Address is required' })],
  });



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
        // this.bindFormDatas();
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

  onSubmit() {
  }


}
