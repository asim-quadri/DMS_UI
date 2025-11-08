import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, RequiredValidator } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RxwebValidators, json } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { Observable } from 'rxjs';
import { TreeNode } from 'src/app/Models/CommonModel';
import { TOCRegistration, TOCDocuments, TOC } from 'src/app/Models/TOC';
import { MajorMinorMapping } from 'src/app/Models/industrysetupModel';
import { accessModel } from 'src/app/Models/pendingapproval';
import { ConcernedMinistry } from 'src/app/Models/postConcernedMinistry';
import { RegulatoryAuthorities } from 'src/app/Models/postRegulatoryAuthorities';
import { RegulationMajorIndustry, RegulationMinorIndustry, RegulationSetupDetailsModel, RegulationSetupLegalEntityType, RegulationTOB, RegulationTOBList, TOBMinorIndustryRequest, TOCListModel } from 'src/app/Models/regulationsetupModel';
import { ResponseModel } from 'src/app/Models/responseModel';
import { ParameterService } from 'src/app/Services/parameter.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';

@Component({
  selector: 'app-toc-registration',
  templateUrl: './toc-registration.component.html',
  styleUrls: ['./toc-registration.component.scss']
})
export class TocRegistrationComponent implements OnInit {
  documents: TOCDocuments[] = [];
  TOBTreeNode: TreeNode[] = [];
  selectedTOBId: number[] = [];
  regulationSetupModel: RegulationSetupDetailsModel | undefined | null;
  editIndex: number | null = null;
  @Output()
  parametersvalues: any[] = [];
  regulationparametersvalues: any;
  formIsValid: boolean = false;
  @Input()
  ruleType: string | undefined;

  @Input()
  ActionType: any;

  @Input()
  tocRegistrationHistory: any | undefined;
  regulatoryAuthority:RegulatoryAuthorities[]=[];
  concernedMinistry:ConcernedMinistry[]=[];
  inReview = false;
  constructor(private modalService: NgbModal, private fb: FormBuilder,
    private notifier: NotifierService,
    public persistance: PersistenceService,
    private regulationSetup: RegulationSetupService,
    private parameterService: ParameterService) {

  }

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public updateData: EventEmitter<TOC> = new EventEmitter<TOC>();

  @Input()
  complianceId: number | undefined;

  @Input()
  ParentComplianceName: any | undefined;

  @Input()
  regulationSetupId: any;

  @Input()
  regulationSetupUID: any;

  @Input()
  regulationSetupName: any | undefined;


  @Input()
  tocRegistration: TOCRegistration = {};

  @Input()
  RegTOC: TOCListModel | undefined;
  @Input()
  isParameterChecked: boolean = false;
  minorIndustoryTreeNode:TreeNode[]=[];
selectedMinorIndustoryId:any[]=[];
 preselectedMajorIndustries: any[] = [];
  selectedMajorIndustryList: MajorMinorMapping[] = [];
   selectedBindlegalEntityType: RegulationSetupLegalEntityType[] = [];
  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [0],
    registrationName: ['', [
      RxwebValidators.required({ message: 'Registration name is required' })
    ]],
    sectionName: [''],
    description: [''],
    document: [''],
    typeOfComplianceRegisterReferenceCode: [''],
    entityTypeId:[''],
    minorIndustryId:[''],
    majorIndustryId:[''],
    concernedMinistryId:['',RxwebValidators.required({ message: "Concerned Ministry is required" })],
    regulatoryAuthorityId: ['', RxwebValidators.required({ message: "Regulatory Authority is required" })],

  });
  ngOnInit(): void {
    this.getRegulationSetupParameter();
    if (this.ActionType === 'Create') {
      this.getNextRegulationSetupTypeOfComplianceRegisterCode();
    }
    if (this.tocRegistrationHistory) {
      this.inReview = true;
      this.regulationSetup.GetTOCHistory(this.tocRegistrationHistory.historyId).subscribe({
        next: (result: any) => {
          // Handle both PascalCase (History) and camelCase (history) property names
          const historyData = result.History || result.history;
          var repsonse = JSON.parse(historyData.tocHistoryJson)
          if (!this.regulationSetupModel) {
            this.regulationSetupModel = {};
          }
          const industryData = result.Industry || result.industry;
          if (industryData && industryData.length > 0) {
            this.tocRegistration.industry = industryData;
             this.regulationSetupModel.industry =industryData;
          } else if (repsonse.industry && repsonse.industry.length > 0) {
            this.regulationSetupModel.industry = repsonse.industry;
            this.tocRegistration.industry = repsonse.industry;
          }
          if (result && result.legalEntityType && result.legalEntityType.length > 0)
            this.regulationSetupModel.legalEntityType = result.legalEntityType;
          
          // Set concerned ministry and regulatory authority data from history
          if (result.concernedMinistry) {
            if (Array.isArray(result.concernedMinistry)) {
              this.concernedMinistry = [...result.concernedMinistry];
            } else {
              this.concernedMinistry = [result.concernedMinistry];
            }
          }
          
          if (result.regulatoryAuthority) {
            if (Array.isArray(result.regulatoryAuthority)) {
              this.regulatoryAuthority = [...result.regulatoryAuthority];
            } else {
              this.regulatoryAuthority = [result.regulatoryAuthority];
            }
          }
          
          this.formgroup.patchValue({
            id: repsonse!.id,
            registrationName: repsonse.registrationName,
            description: repsonse.description,
            // Patch correct UI fields from API response
            sectionName: repsonse.sectionNameOfRegister || '',
            typeOfComplianceRegisterReferenceCode: repsonse.regulationSetupTypeOfComplianceRegisterRC || '',
            concernedMinistryId: repsonse.concernedMinistryId,
            regulatoryAuthorityId: repsonse.regulatoryAuthorityId
          });
          if (repsonse!.tocDocument!) {
            this.documents = repsonse.tocDocument!;
          }

       
          if (repsonse!.tocParameter) {
            this.parametersvalues = repsonse.tocParameter;
          }
          // if (repsonse!.toBs) {
          //   this.TOBTreeNode = [];
          //   var selectedTOBIds = result.tobList
          //     ?.map((tob: RegulationTOB) => tob.tobId)
          //   this.TOBTreeNode = this.transformToTOBMinorTreeNode(result.tobList, selectedTOBIds!);
          // }
            this.formgroup
              .get('majorIndustryId')!
              .patchValue(repsonse?.industry);
            this.formgroup
              .get('entityTypeId')!
              .patchValue(repsonse?.legalEntityType);
        this.bindMajorIndustory()
        this.bindTOBs();
        },
        error: (error: any) => {
          console.log(error);
        }
      });
    }
    else {
      if (this.ActionType == "Edit") {
        this.GetTOCRegistration();
         // this.getRegulationSetupParameter();
        // if (this.isParameterChecked) {
        //  // this.getRegulationSetupParameter();
        // }
      }
    }
    if(this.isParameterChecked){
      this.inReview = true;
    }
  }
  transformToTOBMinorTreeNode(data: any[], param: number[],selecteddata:any[]): TreeNode[] {
    const minorIndustryMap = new Map<number, TreeNode>();

    data.forEach((element) => {
      // Iterate through the Minor Industries for each Major Industry
      element.minorIndustries.forEach((minorIndustry: any) => {
        if (!minorIndustry.minorIndustryId) {
          return; // Skip if minorIndustryId is missing
        }

        // Only process minor industries that have TOBs
    if (minorIndustry.toBs && Array.isArray(minorIndustry.toBs) && minorIndustry.toBs.length > 0){
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
if (selecteddata && Array.isArray(selecteddata) && selecteddata.length > 0) {
  childChecked = selecteddata.some((selected: any) =>
    selected.minorIndustries?.some((mi: any) =>
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
  childChecked = param && param.length > 0 ? param.includes(tob.tobId) : false;
}
            // const childChecked =
            //   param && param.length > 0 ? param.includes(tob.tobId) : false; // Determine checked state
            // 


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
  GetTOCRegistration() {
    this.ruleType = this.RegTOC?.ruleType;
    this.complianceId = this.RegTOC?.typeOfComplianceId! ?? 0;
    this.regulationSetup.GetTOCRegistration(this.RegTOC?.id, this.complianceId, this.regulationSetupId ?? 0, this.ruleType).subscribe({
      next: (result: any) => {
        this.tocRegistration = result;
        this.formgroup.patchValue({
          id: this.tocRegistration!.id,
          registrationName: this.tocRegistration.registrationName,
          description: this.tocRegistration.description,
          sectionName: this.tocRegistration.sectionNameOfRegister || '',
          typeOfComplianceRegisterReferenceCode: this.tocRegistration.regulationSetupTypeOfComplianceRegisterRC || ''
        });
        if (this.tocRegistration!.tocDocument!) {
          this.documents = this.tocRegistration.tocDocument!;
        }
        if (this.tocRegistration!.tocParameter?.length! > 0) {
          this.parametersvalues = this.tocRegistration.tocParameter!;
        }
        if (this.tocRegistration!.industry && this.tocRegistration!.industry.length > 0) {
          this.regulationSetupModel?.industry?.push(...this.tocRegistration!.industry);
        }
          //  this.selectedMinorIndustoryId =
          //    this.tocRegistration.industry
          //       ?.flatMap(
          //         (majorIndustry: RegulationMajorIndustry | null) =>
          //           majorIndustry?.minorIndustries?.map(
          //             (minorIndustry: RegulationMinorIndustry) =>
          //               minorIndustry.minorIndustryId
          //           ) || []
          //       )
          //       .filter((id): id is number => id !== undefined) || [];

                 this.formgroup
              .get('majorIndustryId')!
              .patchValue(this.tocRegistration?.industry);
            this.formgroup
              .get('entityTypeId')!
              .patchValue(this.tocRegistration?.legalEntityType);
                 this.formgroup
              .get('concernedMinistryId')!
              .patchValue(this.tocRegistration?.concernedMinistryId);
            this.formgroup
              .get('regulatoryAuthorityId')!
              .patchValue(this.tocRegistration?.regulatoryAuthorityId);
        this.bindMajorIndustory()
        this.bindTOBs();
      },
      error: (error: any) => {
        console.log(error);
      }
    });
  }
  getRegulationSetupParameter() {


    this.regulationSetup.getAllRegulationSetupDetails(this.regulationSetupUID).subscribe({
      next: (result: any) => {
        this.regulationSetupModel = result;
       // this.parametersvalues = this.regulationSetupModel?.regulationSetupParameters!;
       if (this.ActionType == 'Create' && this.isParameterChecked) {
            this.regulationparametersvalues =
              this.regulationSetupModel?.regulationSetupParameters || [];
            this.regulationparametersvalues.forEach((element: any) => {
            this.parametersvalues.push(element);
            });
          }
           if (this.ActionType == 'Create' && this.regulationSetupModel && this.regulationSetupModel?.isConcernedAndAuthorityChecked) {
              this.formgroup
              .get('regulatoryAuthorityId')!
              .patchValue(this.regulationSetupModel?.regulatoryAuthorityId);
            this.formgroup
              .get('concernedMinistryId')!
              .patchValue(this.regulationSetupModel?.concernedMinistryId);
          }
              if (this.regulationSetupModel) {
                if (Array.isArray(this.regulationSetupModel.concernedMinistry)) {
                  this.concernedMinistry = [...this.regulationSetupModel.concernedMinistry];
                } else if (this.regulationSetupModel.concernedMinistry) {
                  this.concernedMinistry = [this.regulationSetupModel.concernedMinistry];
                } else {
                  this.concernedMinistry = [];
                }

                if (Array.isArray(this.regulationSetupModel.regulatoryAuthorities)) {
                  this.regulatoryAuthority = [...this.regulationSetupModel.regulatoryAuthorities];
                } else if (this.regulationSetupModel.regulatoryAuthorities) {
                  this.regulatoryAuthority = [this.regulationSetupModel.regulatoryAuthorities];
                } else {
                  this.regulatoryAuthority = [];
                }
              } else {
                this.concernedMinistry = [];
                this.regulatoryAuthority = [];
              }
          this.bindMajorIndustory();
          this.bindTOBs();
          this.bindlegalEntityType();
      },
      error: (error: any) => {
        console.log(error);
      }
    })
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
  bindTOBs() {
    this.TOBTreeNode = [];
     var selectedTOBIds: number[] = [];
        if (this.ActionType !== 'Create') {
          selectedTOBIds =  this.tocRegistration?.industry
          ?.flatMap((major: any) =>
            major.minorIndustries?.flatMap((minor: any) =>
              minor.toBs?.map((tob: any) => tob.tobId) || []
            ) || []
          ) || [];
        }
    // var selectedTOBIds = this.regulationSetupModel?.industry
    //   ?.flatMap((majorIndustry: RegulationMajorIndustry | null) =>
    //     majorIndustry?.minorIndustries?.flatMap((minorIndustry: RegulationMinorIndustry) =>
    //       minorIndustry!.toBs!.map((tob: RegulationTOB) => tob.tobId)
    //     ) || []
    //   )
    //   .filter((id): id is number => id !== undefined) || [];

    this.TOBTreeNode = this.transformToTOBMinorTreeNodeEdit(this.regulationSetupModel?.industry!, selectedTOBIds!);
  }

  transformToTOBMinorTreeNodeEdit(data: any[], param: number[]): TreeNode[] {
    const minorIndustryMap = new Map<number, TreeNode>();

    data.forEach((element) => {
      element.minorIndustries.forEach((minorIndustry: any) => {
        if (!minorIndustry.minorIndustryId) {
          return; 
        }

        // Create or retrieve the parent node for the Minor Industry
        let parentNode = minorIndustryMap.get(minorIndustry.minorIndustryId);
        if (!parentNode) {
          parentNode = {
            name: minorIndustry.minorIndustryName || `Minor Industry ${minorIndustry.minorIndustryId}`,
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

          const childChecked = param && param.length > 0 ? param.includes(tob.tobId) : false; // Determine checked state
          const childNode: TreeNode = {
            name: tob.tobName || `TOB ${tob.tobId}`,
            id: tob.tobId,
            checked: childChecked, // Set checked based on param
          };

          // Add the child node to the parent's children
          parentNode!.children?.push(childNode);

          // If any child is checked, mark the parent as checked
          if (childChecked) {
            parentNode!.checked = true;
          }
        });
      });
    });

    // Convert the map's values to an array and return
    return Array.from(minorIndustryMap.values());
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

  onSubmit() {
    // if (this.tocRegistration) {
  const id = this.formgroup.controls['id'].value;
  const registrationName = this.formgroup.controls['registrationName'].value;
  const description = this.formgroup.controls['description'].value;
  const sectionName = this.formgroup.controls['sectionName'].value;
  const referenceCode = this.formgroup.controls['typeOfComplianceRegisterReferenceCode'].value;
  const regulatoryAuthorityId=this.formgroup.controls['regulatoryAuthorityId'].value;
  const concernedMinistryId=this.formgroup.controls['concernedMinistryId'].value;
  this.tocRegistration!.regulatoryAuthorityId=regulatoryAuthorityId;
  this.tocRegistration!.concernedMinistryId=concernedMinistryId;
  this.tocRegistration!.id = id;
  this.tocRegistration!.registrationName = registrationName;
  this.tocRegistration!.description = description;
  this.tocRegistration!.sectionNameOfRegister = sectionName;
  this.tocRegistration!.regulationSetupTypeOfComplianceRegisterRC = referenceCode;
    this.tocRegistration!.createdBy = this.persistance.getUserId()!;
    this.tocRegistration!.complianceId = this.complianceId == 0 ? null : this.complianceId;
    this.tocRegistration!.regulationSetupId = this.regulationSetupId == 0 ? null : this.regulationSetupId;
    this.tocRegistration.managerId = this.persistance.getManagerId();
    this.tocRegistration.ruleType = "Registration";
    this.tocRegistration.tocParameter = this.parametersvalues;
    this.updateDocuments();
    // this.updateData.emit(this.tocRegistration!);
    // }

       var MajorIndustoryId: Array<number> = [];
      this.formgroup.get('majorIndustryId')!.value.forEach((param: any) => {
        MajorIndustoryId.push(param.majorIndustryId);
      });

      var legalEntityTypeId: Array<number> = [];
      this.formgroup.get('entityTypeId')!.value.forEach((param: any) => {
        legalEntityTypeId.push(param.legalEntityType);
      });
    var selectedLegalEntityTypes: RegulationSetupLegalEntityType[] = [];
      legalEntityTypeId.forEach((entityType) => {
        var entityListSelected = this.selectedBindlegalEntityType.find(
          (f) => f.legalEntityType == entityType
        );
        if (entityListSelected) {
          selectedLegalEntityTypes.push(entityListSelected);
        }
      });
      this.tocRegistration.legalEntityType = selectedLegalEntityTypes;

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
        if (!this.tocRegistration.industry) {
          this.tocRegistration.industry = [];
        }
        this.tocRegistration.industry.push(major);
      });
    this.tocRegistration.tobs = this.getCheckedChildIds(this.TOBTreeNode);
    this.regulationSetup.addTOCRegistration(this.tocRegistration!).subscribe((result: TOCRegistration) => {
      if (result.responseCode === 1) {
        this.notifier.notify("success", result.responseMessage);
        this.reloaddata.emit('reload');
        this.reset();
      } else {
        this.notifier.notify("error", result.responseMessage);
      }
    }, error => {
      this.notifier.notify("error", "Something went wrong");
    });

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

  reset() {
    this.modalService.dismissAll();
    this.GetTOCRegistration();
    this.documents = [];
    this.formgroup.reset();
  }

  updateDocuments() {
    this.tocRegistration!.tocDocument = [];
    this.documents.forEach((element: TOCDocuments) => {
      var doc: TOCDocuments = { id: element.id, documentName: element.documentName };
      this.tocRegistration!.tocDocument?.push(doc);
    });
  }



  addDocument() {
    var newDocument = this.formgroup.controls['document'].value;
    if (newDocument.trim()) {
      if (this.editIndex !== null) {
        this.documents[this.editIndex].id = 0;
        this.documents[this.editIndex].documentName = newDocument;
        this.editIndex = null;
      } else {
        this.documents.push({ documentName: newDocument });
      }

      this.formgroup.patchValue({
        document: ''
      })
    }
    this.updateDocuments();
  }

  removeDocument(index: number) {
    this.documents.splice(index, 1);
    this.updateDocuments();
  }

  editDocument(index: number) {
    this.formgroup.patchValue({
      document: this.documents[index]
    })
    this.editIndex = index;
    this.updateDocuments();
  }

  onParametersChange(parameters: FormArray): void {
    var param: any[] = []
    parameters.value.forEach((element: any) => {
      if (element.parameterTypeId != "") {
        param.push(element)
      }
    });
    this.parametersvalues = param;
    console.log(this.parametersvalues);
  }

  onRegParametersChange(parameters: FormArray): void {
    this.regulationparametersvalues = parameters.value;
    console.log(this.parametersvalues);
  }

  onFormValidityChange(isValid: boolean): void {
    this.formIsValid = isValid;
    console.log('Form is valid:', this.formIsValid);
  }

  acceptSelectedRequests() {
    var model: accessModel = {
      managerId: this.persistance.getManagerId(),
      createdBy: this.persistance.getUserId()!,
      uid: this.tocRegistrationHistory.approverUID,
      tobHistoryId: this.tocRegistrationHistory.historyId
    };

    this.regulationSetup.TOCRegistationApproved(model!).subscribe((result: ResponseModel) => {
      if (result.responseCode == 1) {
        this.notifier.notify("success", result.responseMessage);
        this.reloaddata.emit('reload');
        this.reset();
      } else {
        this.notifier.notify("error", result.responseMessage);
      }
    }, error => {
      this.notifier.notify("error", "Something went wrong");
    });
  }


  rejectSelectedRequests() {
    var model: accessModel = {
      managerId: this.persistance.getManagerId(),
      createdBy: this.persistance.getUserId()!,
      uid: this.tocRegistrationHistory.approverUID,
    };
    this.regulationSetup.TOCRegistationReject(model!).subscribe((result: ResponseModel) => {
      if (result.responseCode == 1) {
        this.notifier.notify("success", result.responseMessage);
        this.reloaddata.emit('reload');
        this.reset();
      } else {
        this.notifier.notify("error", result.responseMessage);
      }
    }, error => {
      this.notifier.notify("error", "Something went wrong");
    });
  }

  getNextRegulationSetupTypeOfComplianceRegisterCode() {
    try {
      this.regulationSetup
        .getNextRegulationSetupTypeOfComplianceRegisterCode()
        .subscribe((nextCode: string) => {
          console.log('Next Type Of Compliance Register Code:', nextCode);
          this.formgroup.controls['typeOfComplianceRegisterReferenceCode'].setValue(nextCode);
          this.formgroup.get('typeOfComplianceRegisterReferenceCode')?.disable();
        });
    } catch (err) {
      console.error('error', 'An unexpected error occurred');
    }
  }

    generateTypeOfComplianceRefCode(event: any) {
    let name = event.target.value;
    const firstThree = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const nextCode =
      this.formgroup.get('typeOfComplianceRegisterReferenceCode')?.value || '';
    const firstNumberMatch = nextCode.match(/\d+/);
    const firstNumber = firstNumberMatch ? firstNumberMatch[0] : '';
    const code = `${firstThree}${firstNumber}`;
    this.formgroup
      .get('typeOfComplianceRegisterReferenceCode')
      ?.setValue(code);
    this.formgroup.get('typeOfComplianceRegisterReferenceCode')?.disable();
  }

  onNodeSelect(event: any) {
    console.log(event);
    this.selectedMinorIndustoryId = this.getCheckedChildIds(event);
    this.GetTOBMinorIndustryMap();
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
  
      if (this.ActionType == 'Create') {
        this.selectedMinorIndustoryId = [];
      }else{
        this.selectedMinorIndustoryId =
             this.tocRegistration?.industry
                ?.flatMap(
                  (majorIndustry: RegulationMajorIndustry | null) =>
                    majorIndustry?.minorIndustries?.map(
                      (minorIndustry: RegulationMinorIndustry) =>
                        minorIndustry.minorIndustryId
                    ) || []
                )
                .filter((id): id is number => id !== undefined) || [];
      }
  
      this.minorIndustoryTreeNode = [
        ...this.transformToMinorTreeNode(
          minorIndustoryItem!,
          this.selectedMinorIndustoryId!
        ),
      ];
    }
      transformToMinorTreeNode(
        data: MajorMinorMapping[],
        param: number[] | null
      ): TreeNode[] {
        const majorIndustryMap = new Map<number, TreeNode>();
        data.forEach((item) => {
          // Skip entries with missing or invalid IDs
          if (!item.majorIndustryId || !item.minorIndustryId) {
            return;
          }
          let parentNode = majorIndustryMap.get(item.majorIndustryId);
          if (!parentNode) {
            parentNode = {
              name:
                item.majorIndustryName || `Major Industry ${item.majorIndustryId}`,
              id: item.majorIndustryId,
              children: [], // Initialize children array
              checked: false, // Initialize parent checked state
            };
            majorIndustryMap.set(item.majorIndustryId, parentNode);
          }
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
          parentNode.children?.push(childNode);
          if (childChecked) {
            parentNode.checked = true;
          }
        });
        return Array.from(majorIndustryMap.values());
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
            this.tocRegistration?.industry
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
            this.tocRegistration?.industry
              ?.flatMap(
                (majorIndustry: RegulationMajorIndustry | null) =>
                  majorIndustry?.minorIndustries?.flatMap(
                    (minorIndustry: RegulationMinorIndustry) =>
                      minorIndustry!.toBs!.map((tob: RegulationTOB) => tob.tobId)
                  ) || []
              )
              .filter((id): id is number => id !== undefined) || [];
      
           this.TOBTreeNode = this.filterTOBBasedOnMinorIndustry(
            result,
            selectedTOBIds!
          );
          this.selectedTOBId = selectedTOBIds;
          console.log('TOBTreeNode ', this.TOBTreeNode);
        });
    }
  
  filterTOBBasedOnMinorIndustry(
    data: MajorMinorMapping[],
    param: number[]
  ): TreeNode[] {
    const minorIndustryMap = new Map<number, TreeNode>();
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
      const childChecked =
        param && param.length > 0
          ? param.includes(parseInt(item.tobId!))
          : false; // Ensure `tobId` is a number
      const childNode: TreeNode = {
        name: item.tobName || `TOB ${item.tobId}`,
        id: parseInt(item.tobId!), // Convert TOB ID to a number
        checked: childChecked, // Set checked state based on param
      };
      parentNode.children?.push(childNode);
      if (childChecked) {
        parentNode.checked = true;
      }
    });
    return Array.from(minorIndustryMap.values());
  }  
}
