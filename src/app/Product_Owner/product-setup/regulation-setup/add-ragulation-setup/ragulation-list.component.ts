import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotifierService } from 'angular-notifier';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { Observable } from 'rxjs';
import { CountryService } from 'src/app/Services/country.service';
import { CountryModel, CountryStateMapping } from 'src/app/Models/countryModel';
import { RegulationGroupService } from 'src/app/Services/regulation.service';
import { RegulationGroupModel } from 'src/app/Models/regulationGroupModel';
import { ParameterService } from 'src/app/Services/parameter.service';
import { ParameterModel } from 'src/app/Models/parameter';
import {
  RegSetupComplianceParameterHistory,
  RegulationDetailsByCountryIdModel,
  RegulationMajorIndustry,
  RegulationMinorIndustry,
  RegulationSetupDetailsModel,
  RegulationSetupLegalEntityType,
  RegulationTOB,
  TOBMinorIndustryRequest,
} from 'src/app/Models/regulationsetupModel';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { MenuOptionModel, UsersModel } from 'src/app/Models/Users';
import { IndustryService } from 'src/app/Services/industry.service';
import {
  IndustryApproval,
  IndustryMapping,
  MajorIndustryModel,
  MajorMinorMapping,
  MinorIndustrypModel,
} from 'src/app/Models/industrysetupModel';
import { EntityTypeService } from 'src/app/Services/entityType.service';
import { EntityTypeModel } from 'src/app/Models/entityTypeModel';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { TreeNode } from 'src/app/Models/CommonModel';
import { any } from 'underscore';
import { el } from 'date-fns/locale';
import { ConcernedMinistry } from 'src/app/Models/postConcernedMinistry';
import { ConcernedMinistryService } from 'src/app/Services/concerned-ministry.service';
import { RegulatoryAuthorityService } from 'src/app/Services/regulatory-authorities.service';
import { RegulatoryAuthorities } from 'src/app/Models/postRegulatoryAuthorities';

@Component({
  selector: 'app-add-ragulation-setup',
  templateUrl: './ragulation-list.component.html',
  styleUrls: ['./ragulation-list.component.scss'],
})
export class AddRagulationSetupComponent implements OnInit, AfterViewInit {
  minorIndustoryTreeNode: TreeNode[] = [];
  TOBTreeNode: TreeNode[] = [];
  active = 'basic-details';
  countryStateMapping: CountryStateMapping[] = [];
  regulation: RegulationGroupModel[] = [];
  regulationByCountry: any[] = [];
  countryRegulationMapping: RegulationGroupModel[] = [];
  industryMapping: IndustryMapping[] = [];
  countryEntityTypeMapping: EntityTypeModel[] = [];
  parameters: ParameterModel[] = [];
  selectedParameters: string[] = [];
  stateList: any[] = [];
  singleRecord: any;
  dropdownOptions: any[] = [];

  selectedCountries: string[] = [];
  selectedMajorIndustries: string[] = [];
  selectedRegulationSetup: string[] = [];
  selectedMajorIndustryList: MajorMinorMapping[] = [];
  selectedMinorIndustryList: MinorIndustrypModel[] = [];
  selectedRegulationGroupList: RegulationGroupModel[] = [];
  selectedEntityList: EntityTypeModel[] = [];
  countries: CountryModel[] = [];
  regulationMapping: RegulationGroupModel[] = [];
  concernedMinistry:ConcernedMinistry[]=[];
   regulatoryAuthority:RegulatoryAuthorities[]=[];
  majorMinorMapping: MajorMinorMapping[] = [];
  preselectedMajorIndustries: any[] = [];
  showNextButton: boolean = false;
  showPreviousButton: boolean = false;
  showSubmitButton: boolean = false;
  parametersvalues: any;
  statevalues: any;
  uniqueItems: any;
  isDropdownDisabled = false;

  @Input()
  ActionType: any;

  @Input()
  set EventActionType(value: any) {
    this.ActionType = value;
    this.ngOnInit();
  }

  get EventActionType(): any[] {
    return this.RegulationSetupUID;
  }

  @Input()
  RegulationSetupUID: any;

  @Input()
  regulationSetupName: any | undefined;

  @Input()
  set EventRegulationSetupUID(value: any[]) {
    this.RegulationSetupUID = value;
    // this.ngOnInit();
  }

  get EventRegulationSetupUID(): any[] {
    return this.RegulationSetupUID;
  }
  @Input()
  regulationSetupId: any;
  @Input()
  ParentComplianceId: any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  formIsValid: boolean = false;

  @Input()
  modal: any;

  @Input()
  users: UsersModel[] = [];

  @Input()
  regulationSetupScreen: boolean = true;

  regulationSetup: RegulationSetupDetailsModel | undefined | null;

  regulationParameter: RegulationDetailsByCountryIdModel | undefined | null;

  selectedMinorIndustoryId: number[] = [];
  selectedTOBId: number[] = [];

  // isParameterChecked: boolean = false;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private notifier: NotifierService,
    public countryService: CountryService,
    private persistance: PersistenceService,
    private parameterservice: ParameterService,
    public industryService: IndustryService,
    public entityTypeService: EntityTypeService,
    private regulationsetupservice: RegulationSetupService,
  private concernedMinistryService:ConcernedMinistryService,
  private regulatoryAuthorityService:RegulatoryAuthorityService,
    private regulationgroupservice: RegulationGroupService,
    private cdRef: ChangeDetectorRef
  ) { }

  onNodeSelect(event: any) {
    console.log(event);
    this.selectedMinorIndustoryId = this.getCheckedChildIds(event);
    this.GetTOBMinorIndustryMap();
  }

  onTOBNodeSelect(event: any) {
    console.log(event);
    this.selectedTOBId = this.getCheckedChildIds(event);
  }
  selectedCountry:number=0;

  formgroup: FormGroup = this.fb.group({
    id: [0],
    regulationSetupDetailsReferenceCode: [''],
    countryId: [
      '',
      RxwebValidators.required({ message: 'Select the Country' }),
    ],
    stateId: [0],
    regulationType: [
      '',
      RxwebValidators.required({ message: 'Select the Regulation Type' }),
    ],
    regulationName: [
      '',
      RxwebValidators.required({ message: 'Enter Regulation Name' }),
    ],
    regulationGroupId: [0],
    description: ['', Validators.required],
    //countryDDId: ['', Validators.required],
    majorIndustryId: [
      '',
      RxwebValidators.required({ message: 'Select the MajorIndustry' }),
    ],
    minorIndustryId: [''],
    entityTypeId: [''],
    parameterName: [''],
    concernedMinistryId:[''],
    regulatoryAuthorityId:[''],
    isParameterChecked: [false],
    isConcernedAndAuthorityChecked:[false],
  });

  async ngOnInit() {
    this.getNextRegulationSetupCode();
    //  this.getCountries();
    // this.getCountrStateMapping();

    this.getParameters();

    if (this.RegulationSetupUID == null) {
      if (this.ActionType == 'Create') {
        this.formgroup.reset();
        //this.getCountries();
        await this.getDropdownBinding(0);
        await this.getNextRegulationSetupCode();

        this.formgroup.patchValue({
          uid: this.regulationSetup?.uid,
          id: this.regulationSetup?.id,
          regulationSetupId: this.regulationSetup?.id,
          regulationName: this.regulationSetup?.regulationName,
          regulationType: this.regulationSetup?.regulationType,
          description: this.regulationSetup?.description,
          isParameterChecked: this.regulationSetup?.isParameterChecked,
          regulationSetupDetailsReferenceCode:
            this.regulationSetup?.regulationSetupDetailsReferenceCode,
        });
        this.parametersvalues = [];
      }
    } else if (this.ActionType == 'Edit') {
      console.log('Edit', new Date());
      this.regulationsetupservice
        .getAllRegulationSetupDetails(this.RegulationSetupUID)
        .subscribe({
          next: async (result: any) => {
            await this.getDropdownBinding(result.countryId);

            this.regulationSetup = result;
            this.formgroup.controls['id'].setValue(result.id);
            this.formgroup.controls['regulationType'].setValue(
              result.regulationType
            );
            if (this.formgroup.get('regulationSetupDetailsReferenceCode')) {
              this.formgroup.patchValue({
                regulationSetupDetailsReferenceCode:
                  result.regulationSetupDetailsReferenceCode,
              });
              this.formgroup
                .get('regulationSetupDetailsReferenceCode')
                ?.disable();
            }
            this.formgroup.controls['countryId'].setValue(result.countryId);
            console.log('Country Id init ---------------', result.countryId);
            this.regulationgroupservice.getCountryRegulationGroupMapping(result.countryId || 0).subscribe((res) => {
              this.selectedRegulationGroupList = res;
              this.formgroup.controls['regulationGroupId'].setValue(result.regulationGroupId);
            });
            this.formgroup.controls['stateId'].setValue(result.stateId);
            this.formgroup.controls['regulationGroupId'].setValue(
              result.regulationGroupId
            );
            this.formgroup.controls['majorIndustryId'].setValue(
              result.majorIndustryId
            );
            
              this.formgroup.controls['isConcernedAndAuthorityChecked'].setValue(
              result.isConcernedAndAuthorityChecked
            );
            this.formgroup.controls['minorIndustryId'].setValue(
              result.minorIndustryId
            );
            this.formgroup.controls['entityTypeId'].setValue(
              result.entityTypeId
            );
            this.formgroup.controls['isParameterChecked'].setValue(
              result.isParameterChecked
            );
            this.formgroup.patchValue({
              uid: this.regulationSetup?.uid,
              id: this.regulationSetup?.id,
              regulationType: this.regulationSetup?.regulationType,
              regulationSetupId: this.regulationSetup?.id,
              regulationName: this.regulationSetup?.regulationName,
              complianceName: this.regulationSetup?.regulationType,
              description: this.regulationSetup?.description,
              majorIndustryId: this.regulationSetup?.majorIndustryId,
              minorIndustryId: this.regulationSetup?.minorIndustryId,
              entityTypeId: this.regulationSetup?.minorIndustryId,
            });
            this.parametersvalues =
              this.regulationSetup?.regulationSetupParameters;

            this.formIsValid = true;
            // this.getStateById(result.countryId);

            // this.GetMinorIndustrybyMajorID();
            if (result.regulationType == 'Central') {
              this.formgroup.controls['stateId'].disable();
            }

            this.selectedCountry= this.formgroup.controls['countryId'].value;
            this.getConcernedMinistryListCountry();
            this.getRegulatoryAuthoritiesListCountry();
   this.formgroup.controls['concernedMinistryId'].setValue(
              result.concernedMinistryId
            );
               this.formgroup.controls['regulatoryAuthorityId'].setValue(
              result.regulatoryAuthorityId
            );
            this.selectedMajorIndustryList = [];
            this.GetMajorIndustryByCountryId(
              this.formgroup.controls['countryId'].value
            );
            setTimeout(() => {
              this.GetLegalEntityTypesByRegulation(this.formgroup.controls['id'].value);
            }, 100);
            this.cdRef.detectChanges();
          },
          error: (error: any) => {
            console.log(error);
          },
        });


    } else if (this.ActionType == 'Review') {
    }
    this.showTab('basic-details');

    var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 8
      var menuOptions = roleMenuOptions.filter(
        (option: MenuOptionModel) => option.parentId === 14
      );
      console.log('Country setup Menu Options:', menuOptions);
      if (menuOptions.length > 0) {
        this.showNextButton =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'Next' && option.canView
          ).length > 0;
        this.showPreviousButton =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'Previous' && option.canView
          ).length > 0;
        this.showSubmitButton =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'Submit' && option.canView
          ).length > 0;
      }
    }
  }

  ngAfterViewInit(): void { }

  loadsecondTab() {
    this.selectedMajorIndustryList = [];
    this.GetMajorIndustryByCountryId(
      this.formgroup.controls['countryId'].value
    );


  }

  async getDropdownBinding(countryid: any): Promise<void> {
    this.getEntity();
    const source: Observable<any>[] = [];
    source.push(this.countryService.getCountryStateMapping());
    //get selected country id
    var selectedCountryId = this.formgroup.controls['countryId'].value;
    source.push(this.regulationgroupservice.getCountryRegulationGroupMapping(selectedCountryId || 0));

    return new Promise((resolve, reject) => {
      this.regulationsetupservice.multipleAPIRequests(source).subscribe({
        next: (result: any) => {
          result[0].forEach((element: CountryModel) => {
            if (
              !this.countries.find((f) => f.countryCode === element.countryCode)
            ) {
              this.countries.push(element);
            }
          });
          result[0]
            .filter((f: any) => f.countryId == countryid)
            .forEach((state: CountryModel) => {
              this.stateList.push(state);
            });
          this.selectedRegulationGroupList = result[1];
          resolve(); // Resolve once the processing is done
        },
        error: (err) => reject(err), // Handle errors
      });
    });
  }

  onSubmit() {
    if (this.formgroup.valid) {
      var param: RegSetupComplianceParameterHistory[] = [];
      this.parametersvalues.forEach((element: any, index: number) => {
        param.push({
          historyId: 0,
          sequence: index + 1,
          createdBy: this.persistance.getUserId()!,
          parameterOperator: element.parameterOperator,
          parameterTypeId:
            element.parameterTypeId == '' ? 0 : Number(element.parameterTypeId),
          parameterTypeValue: element.parameterTypeValue,
        });
      });
      const formValues = this.formgroup.value;
      var regulation: RegulationDetailsByCountryIdModel = {
        ...formValues,
        countryId: +formValues.countryId,
        stateId: +Number(formValues.stateId),
        regulationGroupId: +Number(formValues.regulationGroupId),
        majorIndustryId: formValues.majorIndustryId
          ? +Number(formValues.majorIndustryId)
          : null,
        minorIndustryId: formValues.minorIndustryId
          ? +Number(formValues.minorIndustryId)
          : null,
             concernedMinistryId: formValues.concernedMinistryId
          ? +Number(formValues.concernedMinistryId)
          : null,
             regulatoryAuthorityId: formValues.regulatoryAuthorityId
          ? +Number(formValues.regulatoryAuthorityId)
          : null,
        entityTypeId: formValues.entityTypeId
          ? +Number(formValues.entityTypeId)
          : null,
          
        createdBy: this.persistance.getUserId()!,
        managerId: this.persistance.getManagerId()!,
      };

      // regulation.createdBy = this.persistance.getUserId()!;
      // regulation.managerId = this.persistance.getManagerId()!;
      if (param.length > 0 && param[0].parameterTypeId != 0)
        regulation.regulationSetupParameters = param;
      regulation.isParameterChecked =
        this.formgroup.get('isParameterChecked')?.value;
      if (regulation.id == 0 || regulation.id == null) {
        regulation.id = 0;
        regulation.uid = null;
      }
         regulation.isConcernedAndAuthorityChecked =
        this.formgroup.get('isConcernedAndAuthorityChecked')?.value,
      regulation.createdBy = this.persistance.getUserId()!;
      regulation.approvalManagerId = this.persistance.getManagerId();
      regulation.minorIndustryId = this.formgroup.get('minorIndustryId')?.value;
      regulation.uid = this.RegulationSetupUID!;
      regulation.regulationSetupDetailsReferenceCode = this.formgroup.get(
        'regulationSetupDetailsReferenceCode'
      )?.value;

      // regulation.minorIndustryIds = this.selectedMinorIndustoryId;
      // regulation.tobIds = this.selectedTOBId;
      var MajorIndustoryId: Array<number> = [];
      this.formgroup.get('majorIndustryId')!.value.forEach((param: any) => {
        MajorIndustoryId.push(param.majorIndustryId);
      });
      // regulation.majorIndustryIds = MajorIndustoryId;

      regulation.industry = [];
      MajorIndustoryId.forEach((majorelement) => {
        var majorObj = this.selectedMajorIndustryList.find(
          (f) => f.majorIndustryId == majorelement
        );
        var minorInd = this.getCheckedChildNodes(
          this.minorIndustoryTreeNode,
          majorelement
        );
        var savingMinro: RegulationMinorIndustry[] = [];
        if (minorInd && minorInd.length > 0) {
          minorInd.forEach((minorelement) => {
            var tob = this.getCheckedChildNodes(
              this.TOBTreeNode,
              minorelement.id
            );
            var savingTOB: RegulationTOB[] = [];
            if (tob && tob.length > 0) {
              tob.forEach((tobelement) => {
                var tempTob: RegulationTOB = {
                  tobId: tobelement.id,
                  tobName: tobelement.name,
                };
                savingTOB.push(tempTob);
              });
            }
            var tempMinro: RegulationMinorIndustry = {
              minorIndustryId: minorelement.id,
              minorIndustryName: minorelement.name,
              toBs: savingTOB,
            };
            savingMinro.push(tempMinro);
          });
        }
        var major: RegulationMajorIndustry = {
          majorIndustryId: majorelement,
          majorIndustryName: majorObj?.majorIndustryName!,
          minorIndustries: savingMinro,
        };
        regulation.industry?.push(major);
      });
      if (
        this.selectedTOBId.length < 1 ||
        this.selectedMinorIndustoryId.length < 1
      ) {
        this.notifier.notify('error', 'Please Select The Option');
      }
      console.log(this.formgroup.get('entityTypeId')?.value);
      regulation.legalEntityType = [];
      this.formgroup.get('entityTypeId')?.value.forEach((element: any) => {
        const legalEntityType: RegulationSetupLegalEntityType = {
          id: 0, // new row, so keep 0 or undefined
          regulationSetupId: regulation.id!,
          legalEntityType: element.entityTypeId, // depends on your dropdown binding
        };
        regulation.legalEntityType!.push(legalEntityType);
      });


      this.regulationsetupservice.addRegulationSetup(regulation).subscribe(
        (result: RegulationDetailsByCountryIdModel) => {
          if (result.responseCode == 1) {
            this.notifier.notify('success', result.responseMessage);
            this.reloaddata.emit('reload');
            this.formgroup.reset();
          } else {
            this.notifier.notify('error', result.responseMessage);
          }
        },
        (error) => {
          this.notifier.notify('error', 'Some thing went wrong');
        }
      );
    }
  }

  async onCountryChange(event: any) {
       this.selectedCountry= this.formgroup.controls['countryId'].value; //  if (!isNaN(Number(event))) {
    await this.getDropdownBinding(event);
    this.GetMajorIndustryByCountryId(event);
    this.getConcernedMinistryListCountry();
    this.getRegulatoryAuthoritiesListCountry();
    //   }
  }

  getConcernedMinistryListCountry() {

    this.concernedMinistryService.getConcernedMinistryListCountry (this.selectedCountry).subscribe((result: any) => {
      this.concernedMinistry = result;
    });
  }
  getRegulatoryAuthoritiesListCountry() {
    this.regulatoryAuthorityService.getRegulatoryAuthoritiesListCountry (this.selectedCountry).subscribe((result: any) => {
      this.regulatoryAuthority = result;
    });
  }

  onRegulationTypeSelected(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.isDropdownDisabled = selectedValue === 'Central';
  }

  getCountries() {
    const userId = this.persistance.getUserId()!;
    this.countryService.getAllCountryMaster(userId).subscribe((result: any) => {
      this.countries = result;
      //   console.log("countries", this.countries);
      //  this.addMapping.countryDD.data = result;  // Update the data for the dropdown
    });
  }

  getEntity() {
    this.entityTypeService
      .getCountryEntityTypeMapping()
      .subscribe((result: any) => {
        const seen = new Set<number>();

        this.selectedEntityList = result.filter((item: any) => {
          if (seen.has(item.entityTypeId)) {
            return false; // duplicate → skip
          }
          seen.add(item.entityTypeId);
          return true; // first occurrence → keep full object
        });
      });
  }

  bindFormDatas() {
    this.getCountries();
    this.getCountrStateMapping();
  }

  getStateByIdNew(countryId: any) {
    this.countryService
      .getSateById(countryId, this.persistance.getUserId())
      .subscribe((result: any) => {
        this.stateList = result;
        this.formgroup.updateValueAndValidity();
      });
  }

  GetMajorIndustryByCountryId(countryId: any) {
    this.industryService
      .getIndustryMappingByCountry(countryId)
      .subscribe((result: MajorMinorMapping[]) => {
        this.selectedMajorIndustryList = result;
        this.regulationSetup?.industry?.forEach(
          (element: RegulationMajorIndustry) => {
            const obj = this.selectedMajorIndustryList.find(
              (f) => f.majorIndustryId === element.majorIndustryId
            );
            if (obj) {
              this.preselectedMajorIndustries.push({
                majorIndustryId: obj.majorIndustryId,
                majorIndustryName: obj.majorIndustryName,
              });
            }
          }
        );
        this.formgroup
          .get('majorIndustryId')!
          .patchValue(this.preselectedMajorIndustries);
        if (this.preselectedMajorIndustries.length > 0)
          this.GetMinorIndustrybyMajorIDMap(null);
      });
  }

  GetMinorIndustrybyMajorID() {
    let majorIndustryId = this.formgroup.get('majorIndustryId')?.value;
    this.regulationsetupservice
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

  GetMinorIndustrybyMajorIDMap(event: any) {
    setTimeout(() => {
      var MajorIndustoryId: Array<number> = [];
      this.formgroup.get('majorIndustryId')!.value.forEach((param: any) => {
        MajorIndustoryId.push(param.majorIndustryId);
      });
      this.regulationsetupservice
        .GetMinorIndustrybyMajorIDMap(
          MajorIndustoryId,
          this.formgroup.controls['countryId'].value
        )
        .subscribe((result: MajorMinorMapping[]) => {
          //this.majorMinorMapping = result;
          this.minorIndustoryTreeNode = [];
          this.selectedMinorIndustoryId =
            this.regulationSetup?.industry
              ?.flatMap(
                (majorIndustry: RegulationMajorIndustry | null) =>
                  majorIndustry?.minorIndustries?.map(
                    (minorIndustry: RegulationMinorIndustry) =>
                      minorIndustry.minorIndustryId
                  ) || []
              )
              .filter((id): id is number => id !== undefined) || [];

          this.minorIndustoryTreeNode = this.transformToMinorTreeNode(
            result,
            this.selectedMinorIndustoryId
          );
          console.log('Minor industory ', this.minorIndustoryTreeNode);
          if (
            this.selectedMinorIndustoryId &&
            this.selectedMinorIndustoryId.length > 0
          )
            this.GetTOBMinorIndustryMap();
        });
    }, 200);
  }

  transformToMinorTreeNode(
    data: MajorMinorMapping[],
    param: number[] | null
  ): TreeNode[] {
    const majorIndustryMap = new Map<number, TreeNode>();

    // Iterate through the data to build the TreeNode hierarchy
    data.forEach((item) => {
      // Skip entries with missing or invalid IDs
      if (!item.majorIndustryId || !item.minorIndustryId) {
        return;
      }

      // Check if the major industry (parent) already exists
      let parentNode = majorIndustryMap.get(item.majorIndustryId);
      if (!parentNode) {
        // Create a new parent node if it doesn't already exist
        parentNode = {
          name:
            item.majorIndustryName || `Major Industry ${item.majorIndustryId}`,
          id: item.majorIndustryId,
          children: [], // Initialize children array
          checked: false, // Initialize parent checked state
        };
        majorIndustryMap.set(item.majorIndustryId, parentNode);
      }

      // Create a new child node for the minor industry
      const childChecked =
        param && param!.length > 0
          ? param!.includes(item.minorIndustryId)
          : false; // Check if the minor ID is in the param array
      const childNode: TreeNode = {
        name:
          item.minorIndustryName || `Minor Industry ${item.minorIndustryId}`,
        id: item.minorIndustryId,
        checked: childChecked, // Set checked state based on param
      };

      // Add the child node to the parent's children array
      parentNode.children?.push(childNode);

      // If any child is checked, set the parent's checked state to true
      if (childChecked) {
        parentNode.checked = true;
      }
    });

    // Convert the map's values to an array and return
    return Array.from(majorIndustryMap.values());
  }

  GetTOBMinorIndustryMap() {
    var MajorIndustoryId: Array<number> = [];
    this.formgroup.get('majorIndustryId')!.value.forEach((param: any) => {
      MajorIndustoryId.push(param.majorIndustryId);
    });

    var request: TOBMinorIndustryRequest = {
      majorIndustryIds: MajorIndustoryId,
      countryId: this.formgroup.controls['countryId'].value,
      minorIndustryIds: this.selectedMinorIndustoryId,
    };
    this.regulationsetupservice
      .getTOBMinorIndustryMapping(request)
      .subscribe((result: MajorMinorMapping[]) => {
        //this.majorMinorMapping = result;
        this.TOBTreeNode = [];
        var selectedTOBIds =
          this.regulationSetup?.industry
            ?.flatMap(
              (majorIndustry: RegulationMajorIndustry | null) =>
                majorIndustry?.minorIndustries?.flatMap(
                  (minorIndustry: RegulationMinorIndustry) =>
                    minorIndustry!.toBs!.map((tob: RegulationTOB) => tob.tobId)
                ) || []
            )
            .filter((id): id is number => id !== undefined) || [];

        this.TOBTreeNode = this.transformToTOBMinorTreeNode(
          result,
          selectedTOBIds!
        );
        this.selectedTOBId = selectedTOBIds;
        console.log('TOBTreeNode ', this.TOBTreeNode);
      });
  }

  transformToTOBMinorTreeNode(
    data: MajorMinorMapping[],
    param: number[]
  ): TreeNode[] {
    const minorIndustryMap = new Map<number, TreeNode>();

    // Iterate through the data to build the TreeNode hierarchy
    data.forEach((item) => {
      // Skip entries with missing or invalid IDs
      if (!item.minorIndustryId || !item.tobId) {
        return;
      }

      // Check if the minor industry (parent) already exists
      let parentNode = minorIndustryMap.get(item.minorIndustryId);
      if (!parentNode) {
        // Create a new parent node if it doesn't already exist
        parentNode = {
          name:
            item.minorIndustryName || `Minor Industry ${item.minorIndustryId}`,
          id: item.minorIndustryId,
          children: [], // Initialize children array
          checked: false, // Initialize parent checked state
        };
        minorIndustryMap.set(item.minorIndustryId, parentNode);
      }

      // Check if the TOB ID is in the param array
      const childChecked =
        param && param.length > 0
          ? param.includes(parseInt(item.tobId!))
          : false; // Ensure `tobId` is a number
      const childNode: TreeNode = {
        name: item.tobName || `TOB ${item.tobId}`,
        id: parseInt(item.tobId!), // Convert TOB ID to a number
        checked: childChecked, // Set checked state based on param
      };

      // Add the child node to the parent's children array
      parentNode.children?.push(childNode);

      // If any child is checked, set the parent's checked state to true
      if (childChecked) {
        parentNode.checked = true;
      }
    });

    // Convert the map's values to an array and return
    return Array.from(minorIndustryMap.values());
  }


  GetLegalEntityTypesByRegulation(regulationSetupId: number) {

    // all available entities
    var preselectedLegalEntities: any[] = [];     // reset list

    this.regulationSetup?.legalEntityType!.forEach(
      (element: RegulationSetupLegalEntityType) => {
        const obj = this.selectedEntityList.find(
          (f) => f.entityTypeId === element.legalEntityType
        );
        if (obj) {
          preselectedLegalEntities.push({
            entityTypeId: obj.entityTypeId,
            entityType: obj.entityType
          });
        }
      }
    );

    this.formgroup
      .get('entityTypeId')!
      .patchValue(preselectedLegalEntities);
    this.formgroup.updateValueAndValidity();
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

  // getSelectedStates() {
  //   var newArray = this.countryStateMapping.filter(item => this.selectedCountries.includes(item.countryName!));
  //     return newArray.filter(item => !item.hide);
  // }

  getDetailsByCountryIdRegSetup(countryId: any) {
    this.regulationsetupservice
      .getDetailsByCountryIdRegSetup(countryId)
      .subscribe((result) => {
        this.singleRecord = result;
        this.regulationByCountry = [result];
      });
  }

  getParameters() {
    this.parameterservice
      .getAllParameters()
      .subscribe((result: ParameterModel[]) => {
        this.parameters = result;
        if (this.parameters.length > 0) {
          this.selectedParameters.push(this.parameters[0].parameterName!);
        }
      });
  }

  onParametersChange(parameters: FormArray): void {
    this.parametersvalues = parameters.value;
    console.log(this.parametersvalues);
  }

  onFormValidityChange(isValid: boolean): void {
    this.formIsValid = isValid;
    console.log('Form is valid:', this.formIsValid);
  }

  showTab(tabId: string) {
    this.active = tabId;
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-pane');
    tabs.forEach((tab) => tab.classList.remove('active', 'show'));

    // Show the selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
      selectedTab.classList.add('active', 'show');
    }

    // Update active navigation
    const links = document.querySelectorAll('.nav-link');
    links.forEach((link) => link.classList.remove('active'));

    // const activeLink = document.querySelector(
    //   `[href="#"][onclick*="${tabId}"]`
    // );
    // if (activeLink) {
    //   activeLink.classList.add('active');
    // }
  }

  getCheckedChildIds(nodes: TreeNode[]): number[] {
    const checkedIds: number[] = [];

    nodes.forEach((node) => {
      if (node.children) {
        const childIds = node.children
          .filter((child) => child.checked) // Filter children with `checked: true`
          .map((child) => child.id); // Map to their IDs
        checkedIds.push(...childIds); // Add to the result
      }
    });

    return checkedIds;
  }

  getCheckedChildNodes(nodes: TreeNode[], parentId: number): TreeNode[] {
    const checkedNodes: TreeNode[] = [];

    nodes.forEach((node) => {
      if (node.id === parentId && node.children) {
        // Filter children with `checked: true` and return the full TreeNode objects
        const checkedChildren = node.children
          .filter((child) => child.checked) // Filter children with `checked: true`
          .map((child) => ({
            id: child.id, // Include the child's ID
            name: child.name, // Include the child's name
            checked: child.checked, // Include checked status
          })); // Return the full child node objects
        checkedNodes.push(...checkedChildren); // Add to the result
      }
    });

    return checkedNodes;
  }

  async getNextRegulationSetupCode() {
    try {
      this.regulationsetupservice.getNextRegulationSetupCode().subscribe({
        next: (result: string) => {
          this.formgroup
            .get('regulationSetupDetailsReferenceCode')
            ?.setValue(result);
          this.formgroup.get('regulationSetupDetailsReferenceCode')?.disable();
        },
      });
    } catch (err) {
      console.error(
        'getNextRegulationSetupCode',
        'An unexpected error occurred.'
      );
    }
  }
  generateCodeRefCode(event: any) {
    let name = event.target.value;
    const firstThree = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const currentValue = this.formgroup.get('regulationSetupDetailsReferenceCode')?.value || '';
    const firstNumberMatch = currentValue.match(/\d+/);
    const firstNumber = firstNumberMatch ? firstNumberMatch[0] : '';
    const refCode = `${firstThree}${firstNumber}`;
    this.formgroup.get('regulationSetupDetailsReferenceCode')?.setValue(refCode);
    this.formgroup.get('regulationSetupDetailsReferenceCode')?.disable();
  }

}
