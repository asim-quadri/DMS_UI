import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { TreeNode } from 'src/app/Models/CommonModel';
import { MajorMinorMapping } from 'src/app/Models/industrysetupModel';
import { ParameterModel } from 'src/app/Models/parameter';
import { ConcernedMinistry } from 'src/app/Models/postConcernedMinistry';
import { RegulatoryAuthorities } from 'src/app/Models/postRegulatoryAuthorities';
import {
  RegSetupComplianceModel,
  RegSetupComplianceParameterHistory,
  RegSetupParameterHistory,
  RegulationMajorIndustry,
  RegulationMinorIndustry,
  RegulationSetupDetailsModel,
  RegulationSetupLegalEntityType,
  RegulationTOB,
  RegulationTOBList,
  TOBMinorIndustryRequest,
} from 'src/app/Models/regulationsetupModel';
import { ConcernedMinistryService } from 'src/app/Services/concerned-ministry.service';
import { ParameterService } from 'src/app/Services/parameter.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { RegulatoryAuthorityService } from 'src/app/Services/regulatory-authorities.service';
import { result } from 'underscore';

@Component({
  selector: 'app-add-compliance',
  templateUrl: './add-compliance.component.html',
  styleUrls: ['./add-compliance.component.scss'],
})
export class AddComplianceComponent implements OnInit {
  activeStep: number = 1;
  active = 1;
  parametersDropdown: ParameterModel[] = [];
  TOBTreeNode: TreeNode[] = [];
  selectedTOBId: number[] = [];

  @Input()
  ActionType: any;

  @Input()
  set EventActionType(value: any) {
    this.ActionType = value;
    this.ngOnInit();
  }

  get EventActionType(): any[] {
    return this.RegComplianceUID;
  }

  @Input()
  RegComplianceUID: any;

  @Input()
  regulationSetupName: any | undefined;
  @Input()
  regulationSetupUID: any;
  @Input()
  isParameterChecked: boolean = false;

  inReview: boolean = false;
  actionType: any | undefined;

  @Input()
  set EventRegComplianceUID(value: any[]) {
    this.RegComplianceUID = value;
    this.ngOnInit();
  }

  get EventRegComplianceUID(): any[] {
    return this.RegComplianceUID;
  }
  @Input()
  regulationSetupId: any;
  @Input()
  ParentComplianceId: any;

  @Input()
  ParentComplianceName: any | undefined;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();
  parametersvalues: RegSetupParameterHistory[] = [];
  regulationparametersvalues: RegSetupParameterHistory[] = [];

  formIsValid: boolean = false;
  compliance: RegSetupComplianceModel | undefined | null;
  regulationSetupModel: RegulationSetupDetailsModel | undefined | null;

  selectedMajorIndustryList: MajorMinorMapping[] = [];
  preselectedMajorIndustries: any[] = [];
  minorIndustoryTreeNode: TreeNode[] = [];
  selectedMinorIndustoryId: number[] = [];
  selectedBindlegalEntityType: RegulationSetupLegalEntityType[] = [];
  regulatoryAuthority: RegulatoryAuthorities[] = [];
  concernedMinistry: ConcernedMinistry[] = [];

  constructor(
    private fb: FormBuilder,
    private notifier: NotifierService,
    private persistance: PersistenceService,
    private regulationSetup: RegulationSetupService,
    private parameterService: ParameterService,
    private cdRef: ChangeDetectorRef,
    private regulatoryAuthorityService: RegulatoryAuthorityService,
    private concernedMinistryService: ConcernedMinistryService
  ) {}

  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [0],
    regulationSetupComplianceReferenceCode: [''],
    sectionName: [null],
    regulationSetupId: [''],
    parentComplianceId: [''],
    regulationName: [{ value: '', disabled: true }],
    complianceName: [
      '',
      [
        RxwebValidators.required({
          message: 'Regulation Compliance name is required',
        }),
      ],
    ],
    description: [
      '',
      RxwebValidators.required({ message: 'Description is required' }),
    ],
    regulationSetupUID: [''],
    //majorIndustrycode: [{ value: '' }],
    majorIndustryId: [
      '',
      RxwebValidators.required({ message: 'Select the MajorIndustry' }),
    ],
    entityTypeId: [''],
    minorIndustryId: [''],
    concernedMinistryId: [
      '',
      RxwebValidators.required({ message: 'Select the concerned Ministry' }),
    ],
    regulatoryAuthorityId: [
      '',
      RxwebValidators.required({ message: 'Select the Regulatory Authority' }),
    ],
    isConcernedAndAuthorityChecked: [false],
  });

  ngOnInit(): void {
    if (this.ActionType == 'Create') {
      this.formgroup.reset();
      this.getNextRegulationSetupComplianceCode();
      this.formgroup.patchValue({
        uid: null,
        id: 0,
        regulationSetupId: this.regulationSetupId,
        parentComplianceId: this.ParentComplianceId,
        regulationName: this.regulationSetupName ?? this.ParentComplianceName,
        complianceName: '',
        description: '',
        regulationSetupUID: '',
      });
      this.parametersvalues = [];
      this.regulationparametersvalues = [];
      this.getRegulationSetupParameter();
    } else if (this.ActionType == 'Edit') {
      this.regulationSetup
        .GetRegulationSetupCompliance(this.RegComplianceUID)
        .subscribe({
          next: (result: any) => {
            this.compliance = result;
            this.formgroup.patchValue({
              uid: this.compliance?.uid,
              id: this.compliance?.id,
              regulationSetupId: this.compliance?.regulationSetupId,
              parentComplianceId: this.compliance?.parentComplianceId,
              regulationName: this.compliance?.regulationName,
              complianceName: this.compliance?.complianceName,
              description: this.compliance?.description,
              regulationSetupUID: this.compliance?.regulationSetupUID,
              regulationSetupComplianceReferenceCode:
                this.compliance?.regulationSetupComplianceReferenceCode,
              sectionName: this.compliance?.sectionName,
            });
            this.parametersvalues = this.compliance?.parameters || [];
            this.selectedMinorIndustoryId =
              this.compliance?.industry
                ?.flatMap(
                  (majorIndustry: RegulationMajorIndustry | null) =>
                    majorIndustry?.minorIndustries?.map(
                      (minorIndustry: RegulationMinorIndustry) =>
                        minorIndustry.minorIndustryId
                    ) || []
                )
                .filter((id): id is number => id !== undefined) || [];
            const validMajorIndustries = (this.compliance?.industry ?? [])
              .filter(
                (major: RegulationMajorIndustry | null) =>
                  major?.majorIndustryId != null &&
                  major?.majorIndustryName != null
              )
              .map((major: RegulationMajorIndustry) => ({
                majorIndustryId: major.majorIndustryId,
                majorIndustryName: major.majorIndustryName,
              }));
            this.formgroup
              .get('majorIndustryId')!
              .patchValue(validMajorIndustries);
            this.formgroup
              .get('entityTypeId')!
              .patchValue(this.compliance?.legalEntityType);
            this.formgroup
              .get('concernedMinistryId')!
              .patchValue(this.compliance?.concernedMinistryId);
            this.formgroup
              .get('regulatoryAuthorityId')!
              .patchValue(this.compliance?.regulatoryAuthorityId);
            this.formIsValid = true;
            this.formgroup
              .get('regulationSetupComplianceReferenceCode')
              ?.disable();

            // if(this.isParameterChecked){
            this.getRegulationSetupParameter();
            // }
          },
          error: (error: any) => {
            console.log(error);
          },
        });
    } else if (this.ActionType == 'Review') {
    }
    if (this.isParameterChecked) {
      this.inReview = true;
    }
  }

  getRegulationSetupParameter() {
    this.regulationSetup
      .getAllRegulationSetupDetails(this.regulationSetupUID)
      .subscribe({
        next: (result: any) => {
          this.regulationSetupModel = result;
          if (this.ActionType == 'Create' && this.isParameterChecked) {
            this.regulationparametersvalues =
              this.regulationSetupModel?.regulationSetupParameters || [];
            this.regulationparametersvalues.forEach((element: any) => {
              this.parametersvalues.push(element);
            });
          }
          this.concernedMinistry = Array.isArray(
            this.regulationSetupModel?.concernedMinistry
          )
            ? this.regulationSetupModel?.concernedMinistry ?? []
            : this.regulationSetupModel?.concernedMinistry
            ? [this.regulationSetupModel.concernedMinistry]
            : [];
          this.regulatoryAuthority = Array.isArray(
            this.regulationSetupModel?.regulatoryAuthorities
          )
            ? this.regulationSetupModel?.regulatoryAuthorities ?? []
            : this.regulationSetupModel?.regulatoryAuthorities
            ? [this.regulationSetupModel.regulatoryAuthorities]
            : [];
          if (
            this.ActionType == 'Create' &&
            this.regulationSetupModel?.isConcernedAndAuthorityChecked
          ) {
            this.formgroup.patchValue({
              concernedMinistryId:
                this.regulationSetupModel.concernedMinistryId,
              regulatoryAuthorityId:
                this.regulationSetupModel.regulatoryAuthorityId,
              isConcernedAndAuthorityChecked:
                this.regulationSetupModel.isConcernedAndAuthorityChecked,
            });
          }
          this.bindMajorIndustory();
          this.bindTOBs();
          this.bindlegalEntityType();
        },
        error: (error: any) => {
          console.log(error);
        },
      });
  }

  bindMajorIndustory() {
    var majorIndustoryItem: MajorMinorMapping[] = [];
    var minorIndustoryItem: MajorMinorMapping[] = [];
    this.regulationSetupModel?.industry?.forEach(
      (element: RegulationMajorIndustry) => {
        if (element.majorIndustryId) {
          this.preselectedMajorIndustries.push({
            majorIndustryId: element.majorIndustryId,
            majorIndustryName: element.majorIndustryName,
          });

          majorIndustoryItem.push({
            majorIndustryId: element.majorIndustryId!,
            majorIndustryName: element.majorIndustryName!,
            id: null,
            minorIndustryId: null,
            status: null,
            uID: null,
            minorIndustryName: null,
            majorIndustryCode: null,
            minorIndustryCode: null,
            createdOn: null,
            createdBy: null,
            modifiedOn: null,
            modifiedBy: null,
            managerId: undefined,
            hide: false,
            tobId: null,
            tobName: null,
          });

          if (element.minorIndustries?.length! > 0) {
            element.minorIndustries!.forEach((minor) => {
              minorIndustoryItem.push({
                majorIndustryId: element.majorIndustryId!,
                majorIndustryName: element.majorIndustryName!,
                id: null,
                minorIndustryId: minor.minorIndustryId!,
                status: null,
                uID: null,
                minorIndustryName: minor.minorIndustryName!,
                majorIndustryCode: null,
                minorIndustryCode: null,
                createdOn: null,
                createdBy: null,
                modifiedOn: null,
                modifiedBy: null,
                managerId: undefined,
                hide: false,
                tobId: null,
                tobName: null,
              });
            });
          }
        }
      }
    );

    this.selectedMajorIndustryList = [...majorIndustoryItem];

    // if (this.preselectedMajorIndustries.length > 0)
    //   this.GetMinorIndustrybyMajorIDMap(null);
    //  this.cdRef.detectChanges();
    // Only pre-select for Edit mode, otherwise start with empty selection
    if (this.ActionType == 'Create') {
      this.selectedMinorIndustoryId = [];
    }

    this.minorIndustoryTreeNode = [
      ...this.transformToMinorTreeNode(
        minorIndustoryItem!,
        this.selectedMinorIndustoryId!
      ),
    ];

    //console.log("minorIndustoryTreeNode", this.minorIndustoryTreeNode);
  }

  bindTOBs() {
    this.TOBTreeNode = [];
    var selectedTOBIds: number[] = [];
    if (this.ActionType == 'Edit') {
      selectedTOBIds = selectedTOBIds =
        this.compliance?.industry?.flatMap(
          (major: any) =>
            major.minorIndustries?.flatMap(
              (minor: any) => minor.toBs?.map((tob: any) => tob.tobId) || []
            ) || []
        ) || [];
    }
    // selectedTOBIds = this.regulationSetupModel?.industry
    //   ?.flatMap((majorIndustry: RegulationMajorIndustry | null) =>
    //     majorIndustry?.minorIndustries?.flatMap((minorIndustry: RegulationMinorIndustry) =>
    //       minorIndustry!.toBs!.map((tob: RegulationTOB) => tob.tobId)
    //     ) || []
    //   )
    //   .filter((id): id is number => id !== undefined) || [];

    this.TOBTreeNode = this.transformToTOBMinorTreeNode(
      this.regulationSetupModel?.industry!,
      selectedTOBIds!,
      this.compliance?.industry!
    );
    console.log('TOBTreeNode', this.TOBTreeNode);
  }

  bindlegalEntityType() {
    var legalEntityTypeItem: RegulationSetupLegalEntityType[] = [];
    this.regulationSetupModel?.legalEntityType?.forEach(
      (element: RegulationSetupLegalEntityType) => {
        if (element.id) {
          legalEntityTypeItem.push({
            id: element.id!,
            legalEntityType: element.legalEntityType!,
            entityName: element.entityName!,
          });
        }
      }
    );

    this.selectedBindlegalEntityType = [...legalEntityTypeItem];
  }

  onSubmit() {
    if (this.formgroup.valid) {
      // var compliance: RegSetupComplianceModel = { ...this.formgroup.value };
      // compliance.createdBy = this.persistance.getUserId()!;
      // compliance.managerId = this.persistance.getManagerId()!;

      // if (compliance.id === 0 || compliance.id == null) {
      //   compliance.id = 0;
      //   compliance.uid = null;
      // }
      //  compliance.parameters = null;
      var param: RegSetupComplianceParameterHistory[] = [];
      this.parametersvalues.forEach((element: any, index: number) => {
        if (element.parameterTypeId) {
          param.push({
            historyId: 0,
            sequence: index + 1,
            createdBy: this.persistance.getUserId()!,
            parameterOperator: element.parameterOperator,
            parameterTypeId: element.parameterTypeId,
            parameterTypeValue: element.parameterTypeValue,
          });
        }
      });
      var compliance: RegSetupComplianceModel = {
        createdBy: this.persistance.getUserId()!,
        managerId: this.persistance.getManagerId()!,
        id: this.formgroup.controls['id'].value,
        uid:
          this.formgroup.controls['uid'].value == ''
            ? null
            : this.formgroup.controls['uid'].value,
        regulationName: this.formgroup.controls['regulationName'].value,
        complianceName: this.formgroup.controls['complianceName'].value,
        description: this.formgroup.controls['description'].value,
        historyId: 0,
        regulationSetupId: Number(
          this.formgroup.controls['regulationSetupId'].value
        ),
        parentComplianceId: Number(
          this.formgroup.controls['parentComplianceId'].value
        ),
        sectionName: this.formgroup.controls['sectionName']?.value,
        parameters: param,
        regulationSetupComplianceReferenceCode:
          this.formgroup.controls['regulationSetupComplianceReferenceCode']
            .value,
      };

      var MajorIndustoryId: Array<number> = [];
      this.formgroup.get('majorIndustryId')!.value.forEach((param: any) => {
        MajorIndustoryId.push(param.majorIndustryId);
      });

      var legalEntityTypeId: Array<number> = [];
      this.formgroup.get('entityTypeId')!.value.forEach((param: any) => {
        legalEntityTypeId.push(param.legalEntityType);
      });

      // Initialize compliance properties
      compliance.industry = [];

      var selectedLegalEntityTypes: RegulationSetupLegalEntityType[] = [];
      legalEntityTypeId.forEach((entityType) => {
        var entityListSelected = this.selectedBindlegalEntityType.find(
          (f) => f.legalEntityType == entityType
        );
        if (entityListSelected) {
          selectedLegalEntityTypes.push(entityListSelected);
        }
      });
      compliance.legalEntityType = selectedLegalEntityTypes;

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
          minorInd.forEach((minorelement: any) => {
            var tob = this.getCheckedChildNodes(
              this.TOBTreeNode,
              minorelement.id
            );
            var savingTOB: RegulationTOB[] = [];
            if (tob && tob.length > 0) {
              tob.forEach((tobelement: any) => {
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
        compliance.industry?.push(major);
      });

      compliance.regulatoryAuthorityId =
        this.formgroup.controls['regulatoryAuthorityId'].value;
      compliance.concernedMinistryId =
        this.formgroup.controls['concernedMinistryId'].value;
      compliance.isConcernedAndAuthorityChecked =
        this.formgroup.controls['isConcernedAndAuthorityChecked'].value;
      compliance.tobs = [];
      compliance.tobs = this.getCheckedChildIds(this.TOBTreeNode);

      this.regulationSetup.addCompliance(compliance).subscribe(
        (result: RegSetupComplianceModel) => {
          if (result.responseCode === 1) {
            this.notifier.notify('success', result.responseMessage);
            this.reloaddata.emit('reload');
            this.formgroup.reset();
          } else {
            this.notifier.notify('error', result.responseMessage);
          }
        },
        (error) => {
          this.notifier.notify('error', 'Something went wrong');
        }
      );
    }
  }

  onParametersChange(parameters: FormArray): void {
    this.parametersvalues = parameters.value;
    console.log('Complaince Parameters', this.parametersvalues);
  }

  onRegParametersChange(parameters: FormArray): void {
    this.regulationparametersvalues = parameters.value;
    console.log('Regulation Parameters', this.regulationparametersvalues);
  }

  onFormValidityChange(isValid: boolean): void {
    this.formIsValid = isValid;
    console.log('Form is valid:', this.formIsValid);
  }

  onTOBNodeSelect(event: any) {
    console.log(event);
    this.selectedTOBId = this.getCheckedChildIds(event);
  }

  getCheckedChildIds(nodes: TreeNode[]): number[] {
    const checkedIds: number[] = [];

    nodes.forEach((node) => {
      if (node.checked && (!node.children || node.children.length === 0)) {
        checkedIds.push(node.id);
      }
      if (node.children && node.children.length > 0) {
        const childIds = node.children
          .filter((child) => child.checked) // Filter children with `checked: true`
          .map((child) => child.id); // Map to their IDs
        checkedIds.push(...childIds); // Add to the result
      }
    });

    return checkedIds;
  }

  transformToTOBMinorTreeNode(
    data: any[],
    param: number[],
    selecteddata: any[]
  ): TreeNode[] {
    const minorIndustryMap = new Map<number, TreeNode>();

    data.forEach((element) => {
      // Iterate through the Minor Industries for each Major Industry
      element.minorIndustries.forEach((minorIndustry: any) => {
        if (!minorIndustry.minorIndustryId) {
          return; // Skip if minorIndustryId is missing
        }

        // Only process minor industries that have TOBs
        if (
          minorIndustry.toBs &&
          Array.isArray(minorIndustry.toBs) &&
          minorIndustry.toBs.length > 0
        ) {
          // Create or retrieve the parent node for the Minor Industry
          let parentNode = minorIndustryMap.get(minorIndustry.minorIndustryId);
          if (!parentNode) {
            parentNode = {
              name:
                minorIndustry.minorIndustryName ||
                `Minor Industry ${minorIndustry.minorIndustryId}`,
              id: minorIndustry.minorIndustryId,
              children: [], // Initialize children array for TOBs
              checked: false, // Default to unchecked
            };
            minorIndustryMap.set(minorIndustry.minorIndustryId, parentNode);
          }

          // Process the TOBs (children) for the current Minor Industry
          minorIndustry.toBs.forEach((tob: any) => {
            if (!tob.tobId) {
              return; // Skip if tobId is missing
            }
            let childChecked = false;
            if (
              selecteddata &&
              Array.isArray(selecteddata) &&
              selecteddata.length > 0
            ) {
              childChecked = selecteddata.some((selected: any) =>
                selected.minorIndustries?.some(
                  (mi: any) =>
                    mi.minorIndustryId === minorIndustry.minorIndustryId &&
                    mi.toBs?.some((tobItem: any) => tobItem.tobId === tob.tobId)
                )
              );
              const childNode: TreeNode = {
                name: tob.tobName || `TOB ${tob.tobId}`,
                id: tob.tobId,
                checked: childChecked, // Set checked based on param
              };

              // Add the child node to the parent's children
              parentNode!.children?.push(childNode);
            } else {
              // Check if the TOB ID is in the param array
              childChecked =
                param && param.length > 0
                  ? param.includes(parseInt(element.tobId!))
                  : false; // Ensure `tobId` is a number
              const childNode: TreeNode = {
                name: element.tobName || `TOB ${element.tobId}`,
                id: parseInt(element.tobId!), // Convert TOB ID to a number
                checked: childChecked, // Set checked state based on param
              };

              // Add the child node to the parent's children array
              parentNode!.children?.push(childNode);
            }

            // If any child is checked, mark the parent as checked
            if (childChecked) {
              parentNode!.checked = true;
            }
          });
        }
        // Skip minor industries with no TOBs - they should not appear in TOB tree
      });
    });

    // Convert the map's values to an array and return
    return Array.from(minorIndustryMap.values());
  }

  getNextRegulationSetupComplianceCode() {
    try {
      this.regulationSetup
        .getNextRegulationSetupComplianceCode()
        .subscribe((nextCode: string) => {
          console.log('Next Code:', nextCode);
          this.formgroup.controls[
            'regulationSetupComplianceReferenceCode'
          ].setValue(nextCode);
          this.formgroup
            .get('regulationSetupComplianceReferenceCode')
            ?.disable();
        });
    } catch (err) {
      console.error('error', 'An unexpected error occurred');
    }
  }

  generateComplianceRefCode(event: any) {
    let name = event.target.value;
    const firstThree = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const nextCode =
      this.formgroup.get('regulationSetupComplianceReferenceCode')?.value || '';
    const firstNumberMatch = nextCode.match(/\d+/);
    const firstNumber = firstNumberMatch ? firstNumberMatch[0] : '';
    const code = `${firstThree}${firstNumber}`;
    this.formgroup
      .get('regulationSetupComplianceReferenceCode')
      ?.setValue(code);
    this.formgroup.get('regulationSetupComplianceReferenceCode')?.disable();
  }

  onNodeSelect(event: any) {
    console.log(event);
    this.selectedMinorIndustoryId = this.getCheckedChildIds(event);
    this.GetTOBMinorIndustryMap();
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

  getCheckedChildNodes(nodes: TreeNode[], parentId: number): TreeNode[] {
    const checkedNodes: TreeNode[] = [];

    nodes.forEach((node) => {
      if (
        node.id === parentId &&
        node.checked &&
        (!node.children || node.children.length == 0)
      ) {
        checkedNodes.push({
          id: node.id,
          name: node.name,
          checked: node.checked,
        });
      }
      if (node.id === parentId && node.children && node.children.length > 0) {
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

  // Tab navigation method
  goToTab(tabNumber: number): void {
    this.activeStep = tabNumber;
    console.log('Navigated to tab:', tabNumber);
    console.log('parametersvalues:', this.parametersvalues);
  }
  GetMinorIndustrybyMajorIDMap(event: any) {
    setTimeout(() => {
      var MajorIndustoryId: Array<number> = [];
      this.formgroup.get('majorIndustryId')!.value.forEach((param: any) => {
        MajorIndustoryId.push(param.majorIndustryId);
      });
      this.regulationSetup
        .GetMinorIndustrybyMajorIDMap(
          MajorIndustoryId,
          this.regulationSetupModel?.countryId!
        )
        .subscribe((result: MajorMinorMapping[]) => {
          //this.majorMinorMapping = result;
          this.minorIndustoryTreeNode = [];

          this.selectedMinorIndustoryId =
            this.compliance?.industry
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

  getConcernedMinistryListCountry(countryID: number) {
    this.concernedMinistryService
      .getConcernedMinistryListCountry(countryID)
      .subscribe((result: any) => {
        this.concernedMinistry = result;
      });
  }
  getRegulatoryAuthoritiesListCountry(countryID: number) {
    this.regulatoryAuthorityService
      .getRegulatoryAuthoritiesListCountry(countryID)
      .subscribe((result: any) => {
        this.regulatoryAuthority = result;
      });
  }

  GetTOBMinorIndustryMap() {
    var MajorIndustoryId: Array<number> = [];
    this.formgroup.get('majorIndustryId')!.value.forEach((param: any) => {
      MajorIndustoryId.push(param.majorIndustryId);
    });

    var request: TOBMinorIndustryRequest = {
      majorIndustryIds: MajorIndustoryId,
      countryId: this.regulationSetupModel?.countryId!,
      minorIndustryIds: this.selectedMinorIndustoryId,
    };
    this.regulationSetup
      .getTOBMinorIndustryMapping(request)
      .subscribe((result: MajorMinorMapping[]) => {
        //this.majorMinorMapping = result;
        this.TOBTreeNode = [];
        var selectedTOBIds =
          this.compliance?.industry
            ?.flatMap(
              (majorIndustry: RegulationMajorIndustry | null) =>
                majorIndustry?.minorIndustries?.flatMap(
                  (minorIndustry: RegulationMinorIndustry) =>
                    minorIndustry!.toBs!.map((tob: RegulationTOB) => tob.tobId)
                ) || []
            )
            .filter((id): id is number => id !== undefined) || [];
        this.TOBTreeNode = this.transformToNewTOBMinorTreeNode(
          result,
          selectedTOBIds!
        );
        this.selectedTOBId = selectedTOBIds;
        console.log('TOBTreeNode ', this.TOBTreeNode);
      });
  }

  
  transformToNewTOBMinorTreeNode(
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

}
