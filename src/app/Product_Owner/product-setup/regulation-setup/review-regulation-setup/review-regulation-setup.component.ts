import {
  Component,
  EventEmitter,
  Input,
  Optional,
  Output,
} from '@angular/core';
import { ElementRef, HostListener } from '@angular/core';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import {
  ModalDismissReasons,
  NgbActiveModal,
  NgbDatepickerModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  RegulationDetailsByCountryIdModel,
  RegulationMajorIndustry,
  RegulationMinorIndustry,
  RegulationSetupDetailsModel,
  RegulationSetupLegalEntityType,
  RegulationTOB,
  TOBMinorIndustryRequest,
} from 'src/app/Models/regulationsetupModel';
import { accessModel, pendingApproval } from 'src/app/Models/pendingapproval';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { ApiService } from 'src/app/Services/api.service';
import { RolesModels } from 'src/app/Models/roles';
import { UserRole } from 'src/app/enums/enums';
import { NotifierService } from 'angular-notifier';
import { TreeNode } from 'src/app/Models/CommonModel';
import {
  MajorMinorMapping,
  MinorIndustrypModel,
} from 'src/app/Models/industrysetupModel';
import { IndustryService } from 'src/app/Services/industry.service';
import { EntityTypeService } from 'src/app/Services/entityType.service';
import { EntityTypeModel } from 'src/app/Models/entityTypeModel';
import { RegulatoryAuthorities } from 'src/app/Models/postRegulatoryAuthorities';
import { ConcernedMinistry } from 'src/app/Models/postConcernedMinistry';
import { ConcernedMinistryService } from 'src/app/Services/concerned-ministry.service';
import { RegulatoryAuthorityService } from 'src/app/Services/regulatory-authorities.service';

@Component({
  selector: 'app-review-regulation-setup',
  templateUrl: './review-regulation-setup.component.html',
  styleUrls: ['./review-regulation-setup.component.scss'],
})
export class ReviewRegulationSetupComponent {
  managerid: number = 0;
  roleName = '';
  active = 2;
  disabled = true;
  showDiv: boolean = false;
  closeResult = '';
  isRegulationType = false;
  selectedMajorIndustryList: MajorMinorMapping[] = [];
  selectedMinorIndustryList: MinorIndustrypModel[] = [];
  preselectedMajorIndustries: any[] = [];
  minorIndustoryTreeNode: TreeNode[] = [];
  selectedMinorIndustoryId: number[] = [];
  TOBTreeNode: TreeNode[] = [];
  selectedTOBId: number[] = [];
  selectedEntityList: EntityTypeModel[] = [];
  regulatoryAuthority: RegulatoryAuthorities[] = [];
  concernedMinistry: ConcernedMinistry[] = [];
  activeTabId: string = 'review-basic-details';
  constructor(
    private modalService: NgbModal,
    private elementRef: ElementRef,
    private fb: FormBuilder,
    private persistance: PersistenceService,
    private regulationSetupService: RegulationSetupService,
    public apiService: ApiService,
    public entityTypeService: EntityTypeService,
    private notifier: NotifierService,
    public industryService: IndustryService,
    @Optional() public activeModel: NgbActiveModal,
    private concernedMinistryService: ConcernedMinistryService,
    private regulatoryAuthorityService: RegulatoryAuthorityService
  ) {}

  @Input()
  modal: any;

  @Input()
  approverUID: any;
  @Input()
  regulationType: string | undefined;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  RegulationSetupList: RegulationSetupDetailsModel[] = [];
  pendingRegulationSetupApproval: pendingApproval | undefined;

  regulationSetup: RegulationDetailsByCountryIdModel | undefined | null;
  rolesData: RolesModels[] = [];
  regulationSetupModel: RegulationSetupDetailsModel | undefined | null;

  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [0],
    countryId: [''],
    countryName: [''],
    stateId: [''],
    stateName: [''],
    regulationType: [''],
    regulationName: [''],
    regulationGroupId: [''],
    regulationGroupName: [''],
    description: [''],
    majorIndustryId: [''],
    majorIndustryName: [''],
    minorIndustryId: [''],
    minorIndustryName: [''],
    entityTypeId: [''],
    entityType: [''],
    parameterName: [''],
    concernedMinistryId: [''],
    regulatoryAuthorityId: [''],
    isConcernedAndAuthorityChecked: [false],
  });

  ngOnInit(): void {
    this.getRegulationSetupByUID();
    this.getManagerId();
    this.getEntity();
    this.roleName = this.persistance.getRole()!;
    this.showTab('review-basic-details');
  }

  showTab(tabId: string) {
    this.activeTabId = tabId;
  }

  // showTab(tabId: string) {
  //   // Hide all tabs
  //   const tabs = document.querySelectorAll('.tab-pane');
  //   tabs.forEach(tab => tab.classList.remove('active', 'show'));

  //   // Show the selected tab
  //   const selectedTab = document.getElementById(tabId);
  //   if (selectedTab) {
  //     selectedTab.classList.add('active', 'show');
  //   }

  //   // Update active navigation
  //   const links = document.querySelectorAll('.nav-link');
  //   links.forEach(link => link.classList.remove('active'));

  //   const activeLink = document.querySelector(`[href="#"][onclick*="${tabId}"]`);
  //   if (activeLink) {
  //     activeLink.classList.add('active');
  //   }
  // }

  onNodeSelect(event: any) {
    console.log(event);
    this.selectedMinorIndustoryId = this.getCheckedChildIds(event);
    this.GetTOBMinorIndustryMap();
  }

  onTOBNodeSelect(event: any) {
    console.log(event);
    this.selectedTOBId = this.getCheckedChildIds(event);
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

  GetMinorIndustrybyMajorIDMap(event: any) {
    const MajorIndustoryId: Array<number> = [];
    const majorIndustryValue = this.formgroup.get('majorIndustryId')!.value;

    if (Array.isArray(majorIndustryValue)) {
      majorIndustryValue.forEach((param: any) => {
        MajorIndustoryId.push(param.majorIndustryId);
      });

      //var MajorIndustoryId: Array<number> = [];
      // this.formgroup.get('majorIndustryId')!.value.forEach((param: any) => {
      //   MajorIndustoryId.push(param.majorIndustryId)
      // });
      // majorIndustryValue.forEach((param: any) => {
      //   MajorIndustoryId.push(param.majorIndustryId)
      // });
      this.regulationSetupService
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
    } else {
      console.error(
        'majorIndustryId value is not an array:',
        majorIndustryValue
      );
    }
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
    this.regulationSetupService
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
        console.log('TOBTreeNode ', this.TOBTreeNode);
      });
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

  transformToTOBMinorTreeNode(
    data: MajorMinorMapping[],
    param: number[]
  ): TreeNode[] {
    const minorIndustryMap = new Map<number, TreeNode>();

    data.forEach((item) => {
      // Iterate through the Minor Industries for each Major Industry
      if (!item.minorIndustryId || !item.tobId) {
        return; // Skip if minorIndustryId is missing
      }

      // Create or retrieve the parent node for the Minor Industry
      let parentNode = minorIndustryMap.get(item.minorIndustryId);
      if (!parentNode) {
        parentNode = {
          name:
            item.minorIndustryName || `Minor Industry ${item.minorIndustryId}`,
          id: item.minorIndustryId,
          children: [], // Initialize children array for TOBs
          checked: false, // Default to unchecked
        };
        minorIndustryMap.set(item.minorIndustryId, parentNode);
      }

      const childChecked =
        param && param.length > 0
          ? param.includes(parseInt(item.tobId!))
          : false; // Determine checked state
      const childNode: TreeNode = {
        name: item.tobName || `TOB ${item.tobId}`,
        id: parseInt(item.tobId!),
        checked: childChecked, // Set checked based on param
      };

      // Add the child node to the parent's children
      parentNode.children?.push(childNode);

      // If any child is checked, mark the parent as checked
      if (childChecked) {
        parentNode.checked = true;
      }
    });

    // Convert the map's values to an array and return
    return Array.from(minorIndustryMap.values());
  }

  // bindTOBs() {
  //   this.TOBTreeNode = [];
  //   var selectedTOBIds = this.regulationSetup?.industry
  //     ?.flatMap((majorIndustry: RegulationMajorIndustry | null) =>
  //       majorIndustry?.minorIndustries?.flatMap((minorIndustry: RegulationMinorIndustry) =>
  //         minorIndustry?.toBs?.map((tob: RegulationTOB) => tob.tobId)
  //       ) || []
  //     )
  //     .filter((id): id is number => id !== undefined) || [];
  //     if (this.regulationSetup?.industry) {
  //       this.TOBTreeNode = this.transformToTOBMinorTreeNode(this.regulationSetup.industry, selectedTOBIds);
  //       console.log(this.TOBTreeNode, "TOBTreeNode")
  //     } else {
  //       console.error("Industry data is missing in regulation setup model.");
  //     }
  //   //this.TOBTreeNode = this.transformToTOBMinorTreeNode(this.regulationSetupModel?.industry!, selectedTOBIds!);
  // }

  onSubmit() {
    if (this.formgroup.valid) {
      var parameter: RegulationSetupDetailsModel = { ...this.formgroup.value };
      if (parameter.id == 0 || parameter.id == null) {
        parameter.id = 0;
        parameter.uid = null;
      }
      parameter.createdBy = this.persistance.getUserId()!;
      parameter.approvalManagerId = this.persistance.getManagerId();

      this.regulationSetupService
        .addRegulationSetupDetails(parameter)
        .subscribe(
          (result: RegulationSetupDetailsModel) => {
            if (result.responseCode == 1) {
              this.notifier.notify('success', 'Saved Successfully');

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

  getAllRoles() {
    this.apiService.getAllRoles().subscribe((result: any) => {
      this.rolesData = result.filter(
        (f: any) =>
          f.roleName != UserRole.SuperAdmin &&
          f.roleName != UserRole.ITSupportAdmin
      );
    });
  }

  getRegulationSetupByUID() {
    this.regulationSetupService
      .getHistoryRegulationSetupByID(this.approverUID)
      .subscribe({
        next: (result: any) => {
          this.regulationSetup = result;
          this.formgroup.patchValue({
            uid: this.regulationSetup?.uid,
            id: this.regulationSetup?.historyId,
            countryId: this.regulationSetup?.countryId,
            countryName: this.regulationSetup?.countryName,
            stateId: this.regulationSetup?.stateId,
            stateName: this.regulationSetup?.stateName,
            regulationName: this.regulationSetup?.regulationName,
            regulationType: this.regulationSetup?.regulationType,
            regulationGroupName: this.regulationSetup?.regulationGroupName,
            majorIndustryName: this.regulationSetup?.majorIndustryName,
            minorIndustryName: this.regulationSetup?.minorIndustryName,
            entityTypeId: this.regulationSetup?.entityTypeId,
            entityType: this.regulationSetup?.entityType,
            description: this.regulationSetup?.description,
            isConcernedAndAuthorityChecked:
              this.regulationSetup?.isConcernedAndAuthorityChecked,
          });
          this.formgroup.controls['countryId'].setValue(
            this.regulationSetup?.countryId
          );
          this.selectedMajorIndustryList = [];

          this.GetMajorIndustryByCountryId(
            this.formgroup.controls['countryId'].value
          );
          this.formgroup.controls['isConcernedAndAuthorityChecked'].setValue(
            this.regulationSetup?.isConcernedAndAuthorityChecked
          );

          this.formgroup.controls['concernedMinistryId'].setValue(
            this.regulationSetup?.concernedMinistryId
          );
          this.formgroup.controls['regulatoryAuthorityId'].setValue(
            this.regulationSetup?.regulatoryAuthorityId
          );
          this.GetLegalEntityTypesByRegulation();
          this.getConcernedMinistryListCountry(
            this.formgroup.controls['countryId'].value
          );
          this.getRegulatoryAuthoritiesListCountry(
            this.formgroup.controls['countryId'].value
          );
        },
        error: (error: any) => {
          console.log(error);
        },
      });
  }
  GetLegalEntityTypesByRegulation() {
    // all available entities
    var preselectedLegalEntities: any[] = []; // reset list

    this.regulationSetup?.legalEntityType!.forEach(
      (element: RegulationSetupLegalEntityType) => {
        const obj = this.selectedEntityList.find(
          (f) => f.entityTypeId === element.legalEntityType
        );
        if (obj) {
          preselectedLegalEntities.push({
            entityTypeId: obj.entityTypeId,
            entityType: obj.entityType,
          });
        }
        this.formgroup
          .get('entityTypeId')!
          .patchValue(preselectedLegalEntities);
      }
    );
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

  submitApproved() {
    var model: accessModel = {
      managerId: this.persistance.getManagerId(),
      createdBy: this.persistance.getUserId()!,
      uid: this.approverUID!,
    };
    if (this.persistance.getRole() == UserRole.Reviewer) {
      this.regulationSetupService
        .submitReviewed(model)
        .subscribe((result: any) => {
          if (result) {
            this.notifier.notify('success', result.responseMessage);
          } else {
            this.notifier.notify('error', result.responseMessage);
          }
        });
    } else {
      this.regulationSetupService
        .submitApproved(model)
        .subscribe((result: any) => {
          if (result) {
            this.notifier.notify('success', result.responseMessage);
          } else {
            this.notifier.notify('error', result.responseMessage);
          }
        });
    }
  }

  submitReject() {
    var model: accessModel = {
      managerId: this.persistance.getManagerId(),
      createdBy: this.persistance.getUserId()!,
      uid: this.approverUID!,
    };

    this.regulationSetupService.submitReject(model).subscribe((result: any) => {
      if (result) {
        this.notifier.notify('success', result.responseMessage);
      } else {
        this.notifier.notify('error', result.responseMessage);
      }
    });
  }

  submit(f: any) {
    console.log(f);
  }

  getManagerId() {
    this.managerid = this.persistance.getManagerId()!;
  }

  closeReviewRegulationSetup() {
    (this.activeModel ?? this.modal)?.dismiss?.('dismissed');
    this.reloaddata.emit();
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
}
