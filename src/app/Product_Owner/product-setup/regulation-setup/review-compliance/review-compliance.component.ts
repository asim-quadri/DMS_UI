import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { th } from 'date-fns/locale';
import { TreeNode } from 'src/app/Models/CommonModel';
import { MajorMinorMapping } from 'src/app/Models/industrysetupModel';
import { accessModel } from 'src/app/Models/pendingapproval';
import { RegSetupComplianceModel, RegSetupComplianceParameterHistory, RegulationMajorIndustry, RegulationMinorIndustry, RegulationTOB, TOBMinorIndustryRequest } from 'src/app/Models/regulationsetupModel';
import { RegulatoryAuthorities } from 'src/app/Models/postRegulatoryAuthorities';
import { ConcernedMinistry } from 'src/app/Models/postConcernedMinistry';
import { IndustryService } from 'src/app/Services/industry.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { ConcernedMinistryService } from 'src/app/Services/concerned-ministry.service';
import { RegulatoryAuthorityService } from 'src/app/Services/regulatory-authorities.service';

@Component({
  selector: 'app-review-compliance',
  templateUrl: './review-compliance.component.html',
  styleUrls: ['./review-compliance.component.scss']
})
export class ReviewComplianceComponent implements OnInit {
  persistanceService: PersistenceService | undefined;
  active: string = 'basic-details-compliance';
  TOBTreeNode: TreeNode[] = [];
  selectedTOBId: number[] = [];

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  @Input()
  modal: any;

  @Input()
  approverUID: any ;
  selectedMajorIndustryList: MajorMinorMapping[] = [];
  compliance: RegSetupComplianceModel | undefined | null;
    preselectedMajorIndustries: any[] = [];
    minorIndustoryTreeNode: TreeNode[] = [];
    selectedMinorIndustoryId: number[] = [];
    selectedEntityList: any[] = [];
  regulatoryAuthority: RegulatoryAuthorities[] = [];
  concernedMinistry: ConcernedMinistry[] = [];
  constructor(
    private modalService: NgbModal,private fb: FormBuilder, private persistance: PersistenceService, private notifier: NotifierService, private regulation: RegulationSetupService,public industryService :IndustryService,  private regulationSetupService: RegulationSetupService, private cdr: ChangeDetectorRef, private concernedMinistryService: ConcernedMinistryService, private regulatoryAuthorityService: RegulatoryAuthorityService) {

    this.persistanceService = this.persistance;
  }
  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [0],
    regulationSetupId: [''],
    regulationName: [''],
    complianceName: ['', [
      RxwebValidators.required({ message: 'Regulation Compliance name is required' })
    ]],
    description: ['', RxwebValidators.required({ message: 'Description is required' })],
    majorIndustryId: [[]],
    minorIndustryId: [[]],
    entityTypeId: [[]],
    concernedMinistryId: [''],
    regulatoryAuthorityId: [''],
    isConcernedAndAuthorityChecked: [false],
    sectionName: [''],
    regulationSetupComplianceReferenceCode: ['']
  });

  ngOnInit(): void {
    this.GetRegSetupComplianceHistory();
    this.showTab('basic-details-compliance');
  }

  onTOBNodeSelect(event: any) {
    console.log(event);
    this.selectedTOBId = this.getCheckedChildIds(event);
  }

  getCheckedChildIds(nodes: TreeNode[]): number[] {
    const checkedIds: number[] = [];
    nodes.forEach(node => {
      if (node.children) {
        const childIds = node.children
          .filter(child => child.checked) // Filter children with `checked: true`
          .map(child => child.id); // Map to their IDs
        checkedIds.push(...childIds); // Add to the result
      }
    });

    return checkedIds;
  }

  GetRegSetupComplianceHistory() {
    
    this.regulation.GetRegSetupComplianceHistory(this.approverUID).subscribe({
      next: (result: any) => {
        this.compliance = result;
        this.formgroup.patchValue({
          uid: this.compliance?.uid,
          id: this.compliance?.historyId,
          regulationSetupId: this.compliance?.regulationSetupId,
          regulationName: this.compliance?.regulationName,
          complianceName: this.compliance?.complianceName,
          description: this.compliance?.description,
          concernedMinistryId: this.compliance?.concernedMinistryId,
          regulatoryAuthorityId: this.compliance?.regulatoryAuthorityId,
          isConcernedAndAuthorityChecked: this.compliance?.isConcernedAndAuthorityChecked || false,
          sectionName: this.compliance?.sectionName,
          regulationSetupComplianceReferenceCode: this.compliance?.regulationSetupComplianceReferenceCode

        });
        
  
        this.preselectedMajorIndustries= this.compliance?.industry?.map(ind => ({
          majorIndustryId: ind.majorIndustryId,
          majorIndustryName: ind.majorIndustryName
        })) || [];
        this.selectedEntityList = this.compliance?.legalEntityType?.map((entity) => ({
          entityId: entity.legalEntityType,
          entityName: entity.entityName
        })) || [];
        this.selectedMinorIndustoryId = this.compliance?.industry
        ?.flatMap((majorIndustry: RegulationMajorIndustry | null) =>
          majorIndustry?.minorIndustries?.map((minorIndustry: RegulationMinorIndustry) => minorIndustry.minorIndustryId) || []
        )
        .filter((id): id is number => id !== undefined) || [];
        
        this.GetMajorIndustry();
        this.GetLegalEntityTypesByRegulation();
        
        // Handle concerned ministry data from response
        if (this.compliance?.concernedMinistry) {
          if (Array.isArray(this.compliance.concernedMinistry)) {
            this.concernedMinistry = this.compliance.concernedMinistry;
          } else { 
            this.concernedMinistry = [this.compliance.concernedMinistry as any];
          }
        }
        
        // Handle regulatory authority data from response
        if (this.compliance?.regulatoryAuthorities) {
          if (Array.isArray(this.compliance.regulatoryAuthorities)) {
            this.regulatoryAuthority = this.compliance.regulatoryAuthorities;
          } else {
            this.regulatoryAuthority = [this.compliance.regulatoryAuthorities as any];
          }
        }
        
        // Load additional dropdown data if needed (for cases where the response doesn't contain all options)
        const countryId = 1; // Using default country ID - update this to get actual country ID
        if (!this.compliance?.concernedMinistry) {
          this.getConcernedMinistryListCountry(countryId);
        }
        if (!this.compliance?.regulatoryAuthorities) {
          this.getRegulatoryAuthoritiesListCountry(countryId);
        }
   
      },
      error: (error: any) => {
        console.log(error);
      }
    })
  }


  transformToTOBMinorTreeNode(data: RegulationTOB[], param: number[] | null): TreeNode[] {
    const tobList = new Map<number, TreeNode>();

    data.forEach(item => {
      const childChecked = param && param.length > 0 ? param.includes(item.tobId!) : false; 
      const childNode: TreeNode = {
        name: item.tobName || `TOB ${item.tobId}`,
        id: item.tobId!,
        checked: childChecked,  // Mark as checked based on the param array
        children: []  // Children are empty for now
      };

      tobList.set(item.tobId!, childNode);
    });
  
    // Return only the flat list of TOBs
    return Array.from(tobList.values());
  }

  GetMajorIndustry() {
    this.selectedMajorIndustryList=this.preselectedMajorIndustries;
    // Set the preselected major industries in the form
    this.formgroup.get("majorIndustryId")!.patchValue(this.preselectedMajorIndustries);
    if (this.preselectedMajorIndustries.length > 0)
      this.GetMinorIndustrybyMajorIDMap(null);
  }

  GetMinorIndustrybyMajorIDMap(event: any) {
    const MajorIndustoryId: Array<number> = [];
    const majorIndustryValue = this.preselectedMajorIndustries; // Use preselected data
  const minorList: RegulationMinorIndustry[] = [];

    if (Array.isArray(majorIndustryValue)) {
      majorIndustryValue.forEach((param: any) => {
        MajorIndustoryId.push(param.majorIndustryId);
      });
      
  // Extract minor industries from compliance data and push to minorList
      this.compliance?.industry?.forEach((majorIndustry: RegulationMajorIndustry) => {
        majorIndustry?.minorIndustries?.forEach((minorIndustry: RegulationMinorIndustry) => {
          const minorMapping: RegulationMinorIndustry = {
            minorIndustryId: minorIndustry.minorIndustryId,
            minorIndustryName: minorIndustry.minorIndustryName,
            majorIndustryId:majorIndustry.majorIndustryId,
             majorIndustryName:majorIndustry.majorIndustryName
          };
          minorList.push(minorMapping);
        });
      });
        this.minorIndustoryTreeNode = [];
        this.minorIndustoryTreeNode = this.transformToMinorTreeNode(minorList, this.selectedMinorIndustoryId);
        console.log("Minor industry tree:", this.minorIndustoryTreeNode);
        
        if (this.selectedMinorIndustoryId && this.selectedMinorIndustoryId.length > 0)
          this.GetTOBMinorIndustryMap();
  }

}
  transformToMinorTreeNode(data: RegulationMinorIndustry[], param: number[] | null): TreeNode[] {
    const majorIndustryMap = new Map<number, TreeNode>();

    // Iterate through the data to build the TreeNode hierarchy
    data.forEach(item => {
      // Skip entries with missing or invalid IDs
      if (!item.majorIndustryId || !item.minorIndustryId) {
        return;
      }

      // Check if the major industry (parent) already exists
      let parentNode = majorIndustryMap.get(item.majorIndustryId);
      if (!parentNode) {
        // Create a new parent node if it doesn't already exist
        parentNode = {
          name: item.majorIndustryName || `Major Industry ${item.majorIndustryId}`,
          id: item.majorIndustryId,
          children: [], // Initialize children array
          checked: false, // Initialize parent checked state
        };
        majorIndustryMap.set(item.majorIndustryId, parentNode);
      }

      // Create a new child node for the minor industry
      const childChecked = param && param.length > 0 ? param.includes(item.minorIndustryId) : false;
      const childNode: TreeNode = {
        name: item.minorIndustryName || `Minor Industry ${item.minorIndustryId}`,
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
    this.preselectedMajorIndustries.forEach((param: any) => {
      MajorIndustoryId.push(param.majorIndustryId);
    });

    var request: TOBMinorIndustryRequest = {
      majorIndustryIds: MajorIndustoryId,
      countryId: 0, // Set appropriate country ID if needed
      minorIndustryIds: this.selectedMinorIndustoryId,
    };
    

      var selectedTOBIds = this.compliance?.industry
        ?.flatMap((majorIndustry: RegulationMajorIndustry | null) =>
          majorIndustry?.minorIndustries?.flatMap((minorIndustry: RegulationMinorIndustry) =>
            minorIndustry!.toBs!.map((tob: RegulationTOB) => tob.tobId)
          ) || []
        )
        .filter((id): id is number => id !== undefined) || [];

      const mappedTOBList: RegulationTOB[] =
        (this.compliance?.industry
          ?.flatMap((majorIndustry: RegulationMajorIndustry | null) =>
            majorIndustry?.minorIndustries?.flatMap((minorIndustry: RegulationMinorIndustry) =>
              minorIndustry!.toBs!.map(item => ({
                tobId: typeof item.tobId === 'string' ? Number(item.tobId) : item.tobId ?? undefined,
                tobName: item.tobName ?? undefined,
              }))
            ) || []
          )
          .filter((item): item is { tobId: number | undefined; tobName: string | undefined } => item !== undefined)) || [];

      this.TOBTreeNode = this.transformToTOBMinorTreeNode(mappedTOBList, selectedTOBIds!);
      console.log("TOBTreeNode:", this.TOBTreeNode);
  }
  
  acceptSelectedRequests() {
    var model: accessModel = {
      managerId: this.persistance.getManagerId(),
      createdBy: this.persistance.getUserId()!,
      uid: this.approverUID!
    };
    this.regulation.RegComplianceApproved(model).subscribe({
      next: (result: any) => {
        if(result.responseCode == 1){
           this.notifier.notify("success", result.responseMessage);
           this.reloaddata.emit('reload');
          this.formgroup.reset();
          this.modalService.dismissAll();
          }
          else{
            this.notifier.notify("error", result.responseMessage);
          }

      },
      error: (error: any) => {
        console.log(error);
      }
    })
  }

  rejectSelectedRequests() {
    var model: accessModel = {
      managerId: this.persistance.getManagerId(),
      createdBy: this.persistance.getUserId()!,
      uid: this.approverUID!
    };

    this.regulation.RegComplianceReject(model).subscribe({
      next: (result: any) => {
        if(result.responseCode == 1){
           this.notifier.notify("success", result.responseMessage);
          // this.reloaddata.emit('reload');
          this.formgroup.reset();
          }
          else{
            this.notifier.notify("error", result.responseMessage);
          }

      },
      error: (error: any) => {
        console.log(error);
      }
    })
  }
close()
{
  this.modalService.dismissAll();
}

 
 GetLegalEntityTypesByRegulation() {

    // all available entities
    var preselectedLegalEntities=this.selectedEntityList;    

         this.formgroup
      .get('entityTypeId')!
      .patchValue(preselectedLegalEntities);
    
  }
  
  showTab(tabId: string) {
    this.active = tabId;
  }

  getConcernedMinistryListCountry(countryID: number) {
    this.concernedMinistryService
      .getConcernedMinistryListCountry(countryID)
      .subscribe((result: any) => {
        // If we already have data from the compliance response, merge it
        if (this.concernedMinistry && this.concernedMinistry.length > 0) {
          // Check if the current ministry is already in the result
          const existingIds = result.map((item: any) => item.id);
          const currentMinistry = this.concernedMinistry.find((ministry: any) => !existingIds.includes(ministry.id));
          if (currentMinistry) {
            result.push(currentMinistry);
          }
        }
        this.concernedMinistry = result;
      });
  }

  getRegulatoryAuthoritiesListCountry(countryID: number) {
    this.regulatoryAuthorityService
      .getRegulatoryAuthoritiesListCountry(countryID)
      .subscribe((result: any) => {
        // If we already have data from the compliance response, merge it
        if (this.regulatoryAuthority && this.regulatoryAuthority.length > 0) {
          // Check if the current authority is already in the result
          const existingIds = result.map((item: any) => item.id);
          const currentAuthority = this.regulatoryAuthority.find((authority: any) => !existingIds.includes(authority.id));
          if (currentAuthority) {
            result.push(currentAuthority);
          }
        }
        this.regulatoryAuthority = result;
      });
  }

}
