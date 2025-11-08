import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { EntityModel, Months, Years } from 'src/app/Models/entityModel';
import { EntityService } from 'src/app/Services/entity.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { CountryService } from 'src/app/Services/country.service';
import {
  CountryModel,
  CountryStateMapping,
  StatesModel,
} from 'src/app/Models/countryModel';
import { Constant } from 'src/app/@core/utils/constant';
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

import { ActivatedRoute } from '@angular/router';
import { MenuOptionModel } from 'src/app/Models/Users';

@Component({
  selector: 'app-entity-details',
  templateUrl: './entity-details.component.html',
  styleUrls: ['./entity-details.component.scss'],
})
export class EntityDetailsComponent {
  headerLabel: string = 'Entity Details';
  buttonLabel: string = 'Update';
  currentApprovalRecord: any;
  countries: CountryModel[] = [];
  states: StatesModel[] = [];
  countryStateMapping: CountryStateMapping[] = [];
  selectedCountries: string[] = [];
  stateList = [];
  selectedStateList: any[] = [];
  selectedCountryList: any[] = [];
  majorindustry = [];
  minorindustry: MinorIndustrypModel[] = [];
  selectedMajorIndustryList: MajorIndustryModel[] = [];
  selectedMinorIndustryList: MinorIndustrypModel[] = [];
  OrgId: any = 1;
  EntityId: any = 1;
  uid: string;
  organizationName: string = '';
  entityName: string = '';
  selectedYear: number = 0;
  years: Years[] = [];
  months: any = {};
  showUpdateButton: boolean = false;

  @Input()
  modal: any;
  industryMapping: IndustryMapping[] = [];
  countryEntityTypeMapping: EntityTypeModel[] = [];
  selectedEntityList: EntityTypeModel[] = [];
  selectedEntity: EntityModel[] = [];
  selectedEditRecord: any;
  isEditMode: boolean = false;
  entityList: any;
  majorMinorMapping: MajorMinorMapping[] = [];
  selectedMajorIndustries: string[] = [];
  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  formgroup: FormGroup;
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    public countryService: CountryService,
    public entityService: EntityService,
    private notifier: NotifierService,
    private persistance: PersistenceService,
    public industryService: IndustryService,
    public entityTypeService: EntityTypeService
  ) {
    this.headerLabel = 'Add New Entity';
    this.buttonLabel = 'Add Entity';
    this.uid = this.persistance.getUserUID()!;
    this.years = this.getYears();
    this.formgroup = this.fb.group({
      entityName: ['', Validators.required],
      countryId: ['', Validators.required],
      stateId: ['', Validators.required],
      city: ['', Validators.required],
      entityType: ['', Validators.required],
      majorIndustry: ['', Validators.required],
      minorIndustry: ['', Validators.required],
      address: ['', Validators.required],
      pin: ['', [Validators.required, Validators.pattern('[0-9]{5}')]],
      financialYearStart: ['', Validators.required],
      financialYearEnd: ['', Validators.required],
      fromMonth: ['', Validators.required],
      toMonth: ['', Validators.required],
    });
    this.formgroup.reset();
  }

  ngOnInit(): void {
    this.EntityId = this.route.snapshot.paramMap.get('entityId');
    this.OrgId = this.route.snapshot.paramMap.get('orgId');
    this.isEditMode = true;
    this.getCountryByOrgId(this.OrgId);
    this.getCountrStateMapping();
    this.entityService.getClearForm().subscribe((res) => {
      if (res) this.clearForm();
    });
    //Initialize selected countries if needed
    this.formgroup.patchValue({
      countryId: this.selectedCountries,
    });

    this.entityService.getEntityDetails(this.EntityId).subscribe((entity) => {
      if (entity) {
        this.entityList = entity;
        this.isEditMode = true;
        this.getStateById(entity.countryId);
        this.bindFormDatas();
        this.loadData(entity);
      }
    });
    var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');      
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 3
      var menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 3);
      console.log('Org setup Menu Options:', menuOptions);
      if (menuOptions.length > 0) {
        this.showUpdateButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Add Organization' && option.canView).length > 0;
      }
    }
  }

  getEndYear(evt: any) {
    var entity: EntityModel = { ...this.formgroup.value };
    var fmonth = entity.fromMonth;
    var tmonth = entity.toMonth;
    const year = evt != null ? evt.target.value : entity.financialYearStart;

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
    const monthIndex = months.indexOf(fmonth!);
    if (monthIndex === -1) {
      throw new Error('Invalid month name');
    }
    const date = new Date(year, monthIndex, 1);
    var fyMonth = date.getMonth() + 1;
    const nextYear = fyMonth != 1 || fmonth === tmonth ? +year + 1 : year;
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

  loadData(entity: any) {
    (this.organizationName = entity.organizationName),
      (this.entityName = entity.entityName);
    this.formgroup.patchValue({
      entityName: entity.entityName,
      countryId: entity.countryId,
      stateId: entity.stateId,
      city: entity.city,
      entityType: entity.entityTypeId,
      majorIndustry: entity.majorIndustryId,
      minorIndustry: entity.minorIndustryId,
      address: entity.address,
      pin: entity.pin,
      financialYearStart: entity.financialYearStart,
      financialYearEnd: entity.financialYearStart,
      fromMonth: entity.fromMonth,
      toMonth: entity.toMonth,
    });
    this.GetMinorIndustrybyMajorID();
    this.formgroup.updateValueAndValidity();
  }

  clearForm(): void {
    this.formgroup.reset(); // Reset the form to initial state
  }

  bindFormDatas() {
    //this.getCountryByOrgId(this.OrgId);
    this.getCountrStateMapping();
  }

  getCountryByOrgId(orgId: any) {
    this.countryService.getCountryByOrgId(orgId).subscribe((result: any) => {
      this.countries = result;
    });
  }

  onCountryChange(event: any) {
    const selectedValue = event.target.value;
    this.getStateById(selectedValue);
    this.getStartAndEndMonths(selectedValue);
    this.getEndYear(null);
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

  getStateById(countryId: any) {
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
        }),
        switchMap((result: EntityTypeModel[]) => {
          this.countryEntityTypeMapping = result;
          console.log('this one new' + result);

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

  onSubmit() {
    var entity: EntityModel = { ...this.formgroup.value };
    entity.createdBy = this.persistance.getUserId()!;
    entity.managerId = this.persistance.getManagerId()!;
    entity.entityTypeId = +entity.entityType!;
    entity.organizationId = this.OrgId;
    if (entity.id == 0 || entity.id == null) {
      entity.id = 0;
      entity.uID = this.persistance.getUserUID();
    }
    if (this.currentApprovalRecord) {
      entity.approvalUID = this.currentApprovalRecord.uid!;
    }

    if (this.isEditMode) {
      if (this.compareEntities(this.entityList, entity)) {
        entity.status = this.entityList.statusId;
        entity.id = this.entityList.id;
        entity.uID = this.entityList.uid;
        entity.modifiedBy = this.persistance.getUserId()!;
        entity.managerId = this.entityList.managerId;
        this.entityService.postEntity(entity).subscribe(
          (result: EntityModel) => {
            if (result) {
              this.notifier.notify('success', 'Sent for Approval');
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
      this.entityService.postEntity(entity).subscribe(
        (result: EntityModel) => {
          if (result) {
            this.notifier.notify('success', 'Entity Inserted Successfully');
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
  }

  compareEntities(obj1: EntityModel, obj2: EntityModel): boolean {
    const keys = Object.keys(obj1) as (keyof EntityModel)[];

    for (let key of keys) {
      if (obj1[key] !== obj2[key]) {
        return true;
      }
    }
    return false;
  }

  GetMinorIndustrybyMajorID() {
    let majorIndustryId = this.formgroup.get('majorIndustry')?.value;
    console.log('majorindustry change', majorIndustryId);
    this.entityService
      .GetMinorIndustrybyMajorID(majorIndustryId)
      .subscribe((result: any[]) => {
        console.log('majorindustry change', result);

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
