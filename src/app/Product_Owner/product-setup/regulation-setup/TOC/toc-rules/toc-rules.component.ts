import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { disable, RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { TreeNode } from 'src/app/Models/CommonModel';
import { TOC, TOCDueDates, TOCDues, TOCImprisonment, TOCIntrestPenality, TOCRules } from 'src/app/Models/TOC';
import { MajorMinorMapping } from 'src/app/Models/industrysetupModel';
import { accessModel } from 'src/app/Models/pendingapproval';
import { ConcernedMinistry } from 'src/app/Models/postConcernedMinistry';
import { RegulatoryAuthorities } from 'src/app/Models/postRegulatoryAuthorities';
import { RegulationMajorIndustry, RegulationMinorIndustry, RegulationSetupDetailsModel, RegulationSetupLegalEntityType, RegulationTOB, RegulationTOBList, TOBMinorIndustryRequest, TOCListModel } from 'src/app/Models/regulationsetupModel';
import { ResponseModel } from 'src/app/Models/responseModel';
import { CommonService } from 'src/app/Services/common.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';

@Component({
  selector: 'app-toc-rules',
  templateUrl: './toc-rules.component.html',
  styleUrls: ['./toc-rules.component.scss']
})
export class TocRulesComponent implements OnInit {
  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  public updateData: EventEmitter<TOC> = new EventEmitter<TOC>();
  @Input()
  complianceId: number | undefined;
  @Input()
  ParentComplianceName: any | undefined;

  @Input()
  RegTOC: TOCListModel | undefined;

  @Input()
  regulationSetupId: number | undefined;

  @Input()
  regulationSetupUID: any;
  @Input()
  isParameterChecked: boolean = false;

  @Input()
  regulationSetupName: any | undefined;

  @Input()
  ActionType: any;

  inReview = false;

  @Input()
  tocModel: TOCRules | undefined;
  @Input()
  active: number | undefined;
  @Input()
  ruleType: string | undefined;

  tocId: number | undefined; 

  TOBTreeNode: TreeNode[] = [];
  selectedTOBId: number[] = [];

  regulationSetupModel: RegulationSetupDetailsModel | undefined | null;
  selectedBindlegalEntityType:RegulationSetupLegalEntityType[] = [];

  @Output()
  regulationparametersvalues: any;

  @Input()
  tocRulesHistory: any | undefined;
  durationOptions: string[] = ['Days', 'Months', 'Years'];
  durationFrom: string = 'Months';
  durationTo: string = 'Years';
  currentStep: number = 0;
  parametersvalues: any[] = [];
  formIsValid: boolean = false;
   financialYearStartMonth: Date = new Date(new Date().getFullYear(), 0, 1);
  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [0],
    regulationSetupId: [''],
    parentComplianceId: [''],
    regulationName: [''],
    description: [''],
    isParameterChecked: [''],
    regulationSetupUID: [''],
  });

  formDues: FormGroup = this.fb.group({
     duesReferenceCode: [{ value: '', disabled: true }],
     sectionNameofDues: [''],
     frequency: ['monthly'],
     month: [''],
     dueDate: [''],
     id: ['0'],
  });
  formInterestPenalty = this.fb.group({
    id: [''],
    sectionName: ['', Validators.required],
    interestType: ['', Validators.required],
    interestRate: ['', Validators.required],
    interestRatePeriod: ['', Validators.required],
    period: ['', Validators.required],
    penaltyRate: ['', Validators.required],
    penaltyRatePeriod: ['', Validators.required]
  });

  formImprisonment = this.fb.group({
    id: [''],
    sectionName: ['', Validators.required],
    durationType: ['', Validators.required],
    durationTypeEnd: [{ value: '', disabled: true }, Validators.required],
    durationFrom: ['', Validators.required],
    durationTo: ['', Validators.required],
    forWhom: ['', Validators.required],
    majorIndustryId: this.fb.control<any[]>([]),
    minorIndustryId: ['',Validators.required],
    entityTypeId: this.fb.control<any[]>([]),
    concernedMinistryId: ['',RxwebValidators.required({ message: "Concerned Ministry is required" })],
    regulatoryAuthorityId: ['',RxwebValidators.required({ message: "Regulatory Authority is required" })],

  });

  selectedMajorIndustryList: MajorMinorMapping[] = [];
  preselectedMajorIndustries: any[] = [];
  minorIndustoryTreeNode: TreeNode[] = [];
  selectedMinorIndustoryId: number[] = [];
  concernedMinistry:ConcernedMinistry[]=[];
  regulatoryAuthority:RegulatoryAuthorities[]=[];

  constructor(private modalService: NgbModal, private fb: FormBuilder, private notifier: NotifierService,
    private persistance: PersistenceService, private datePipe: DatePipe, private regulationSetup: RegulationSetupService, private commonService: CommonService) {

    // To react to value changes in the frequency control
    this.formDues.get('frequency')?.valueChanges.subscribe(value => {
      this.onFrequencyChange(value);
    });

    this.formImprisonment.get('durationType')?.valueChanges.subscribe(value => {
      this.formImprisonment.controls['durationTypeEnd'].setValue(value);
    });

    this.mainForm = this.fb.group({
      rows: this.fb.array([])
    });

    this.frequencyForm = this.fb.group({
      frequencytype: ['FlatFrequency'], // default value
    });
  }

  ngOnInit(): void {
    this.tocId = this.RegTOC?.id || this.complianceId;

    console.log(this.RegTOC)
    console.log(this.tocRulesHistory, "tocRulesHistory")
    if (this.tocRulesHistory) {
      this.inReview = true;
      this.regulationSetup.GetTOCHistory(this.tocRulesHistory.historyId).subscribe({
        next: (result: any) => {
          // Handle both PascalCase (History) and camelCase (history) property names
          const historyData = result.History || result.history;
          var repsonse = JSON.parse(historyData.tocHistoryJson)
          this.tocModel = repsonse;
          this.LoadData(0);
          
          // Create a temporary regulationSetupModel to hold the industry data from history
          if (!this.regulationSetupModel) {
            this.regulationSetupModel = {};
          }
          
          // Set industry data from the history response
          // Handle both PascalCase (Industry) and camelCase (industry) property names
          const industryData = result.Industry || result.industry;
          
          if (industryData && industryData.length > 0) {
            this.regulationSetupModel.industry = industryData;
          } else if (repsonse.industry && repsonse.industry.length > 0) {
            this.regulationSetupModel.industry = repsonse.industry;
          }
          if(result && result.legalEntityType && result.legalEntityType.length > 0)
          this.regulationSetupModel.legalEntityType = result.legalEntityType;
            this.concernedMinistry = Array.isArray(result?.concernedMinistry)
            ? [...result.concernedMinistry]
            : result.concernedMinistry
            ? [result.concernedMinistry]
            : [];

            this.regulatoryAuthority = Array.isArray(result?.regulatoryAuthority)
            ? [...result.regulatoryAuthority]
            : result.regulatoryAuthority
            ? [result.regulatoryAuthority]
            : [];
          // Bind industry data to the UI
          this.parametersvalues=this.tocModel?.tocParameter || [];
           this.formImprisonment
              .get('regulatoryAuthorityId')!
              .patchValue(this.tocModel?.regulatoryAuthorityId?.toString() ?? null);
            this.formImprisonment
              .get('concernedMinistryId')!
              .patchValue(this.tocModel?.concernedMinistryId?.toString() ?? null);
          this.bindMajorIndustory();
        this.bindTOBs();
        this.bindlegalEntityType();
          
        },
        error: (error: any) => {
          console.log(error);
        }
      })
    }
    else {
      if (this.ActionType == 'Create') {
        this.getRegulationSetupParameter();
        this.getNextRegulationSetupTypeOfComplianceDuesCode();
      }
      else if (this.ActionType == 'Edit') {
        this.getTOCRules();
        this.getNextRegulationSetupTypeOfComplianceDuesCode();
      }
    }
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

    if(this.ActionType !== 'Create')
    {
      //const entityTypeIds = this.selectedBindlegalEntityType.map(e => e.entityName);
      this.formImprisonment.get('entityTypeId')!
      .patchValue(this.selectedBindlegalEntityType );
    }
  }
  getNextRegulationSetupTypeOfComplianceDuesCode() {
    try {
      this.regulationSetup
        .getNextRegulationSetupTypeOfComplianceDuesCode()
        .subscribe((nextCode: string) => {
          console.log('Next Type Of Compliance Dues Code:', nextCode);
          // Set the value in formDues so it appears in the correct input field
          this.formDues.controls['duesReferenceCode']?.setValue(nextCode);
          this.formDues.get('duesReferenceCode')?.disable();
        });
    } catch (err) {
      console.error('error', 'An unexpected error occurred');
    }
  }
  getTOCRules() {
    this.regulationSetup.GetTOCRules(this.tocId, this.regulationSetupId, this.ruleType).subscribe({
      next: (result: any) => {
        this.tocModel = result
        this.LoadData(0);
        this.getRegulationSetupParameter();
 this.formImprisonment
              .get('regulatoryAuthorityId')!
              .patchValue(this.tocModel?.regulatoryAuthorityId?.toString() ?? null);
            this.formImprisonment
              .get('concernedMinistryId')!
              .patchValue(this.tocModel?.concernedMinistryId?.toString() ?? null);
       
      },
      error: (HttpErrorResponse: any) => {
        console.log(HttpErrorResponse);
        if (HttpErrorResponse.error.status == 404) {
          this.ActionType = 'Create';
          this.getRegulationSetupParameter();
        }
      }
    });
  }

  getRegulationSetupParameter() {
    this.regulationSetup.getAllRegulationSetupDetails(this.regulationSetupUID).subscribe({
      next: (result: any) => {
        this.regulationSetupModel = result;
      this.financialYearStartMonth = result.financialMonth;
     
        if (this.ActionType == 'Create' && this.isParameterChecked) {
          this.parametersvalues = this.regulationSetupModel?.regulationSetupParameters!;
        }

            if (this.ActionType == 'Create' && this.regulationSetupModel && this.regulationSetupModel?.isConcernedAndAuthorityChecked) {
              this.formImprisonment
              .get('regulatoryAuthorityId')!
              .patchValue(this.regulationSetupModel?.regulatoryAuthorityId?.toString() ?? null);
            this.formImprisonment
              .get('concernedMinistryId')!
              .patchValue(this.regulationSetupModel?.concernedMinistryId?.toString() ?? null);
          }
        if (this.regulationSetupModel) {
          this.concernedMinistry = Array.isArray(this.regulationSetupModel.concernedMinistry)
            ? [...this.regulationSetupModel.concernedMinistry]
            : this.regulationSetupModel.concernedMinistry
            ? [this.regulationSetupModel.concernedMinistry]
            : [];

          this.regulatoryAuthority = Array.isArray(this.regulationSetupModel.regulatoryAuthorities)
            ? [...this.regulationSetupModel.regulatoryAuthorities]
            : this.regulationSetupModel.regulatoryAuthorities
            ? [this.regulationSetupModel.regulatoryAuthorities]
            : [];
        } else {
          this.concernedMinistry = [];
          this.regulatoryAuthority = [];
        }

        

        this.bindMajorIndustory();
        this.bindTOBs();
        // this.bindTOBs();
        this.bindlegalEntityType();

      },
      error: (error: any) => {
        console.log(error);
      }
    })
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
            tobName: null
          });

          if (element.minorIndustries?.length! > 0) {
            element.minorIndustries!.forEach(minor => {

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
                tobName: null
              });
            });
          }
        }
      }
    );

    this.selectedMajorIndustryList = [...majorIndustoryItem];
     if (this.ActionType !== 'Create')
     {
    this.formImprisonment
      .get('majorIndustryId')!
      .patchValue(this.preselectedMajorIndustries);
     }
    // if (this.preselectedMajorIndustries.length > 0)
    //   this.GetMinorIndustrybyMajorIDMap(null);
    //  this.cdRef.detectChanges();
   if (this.ActionType == 'Create'){
        this.selectedMinorIndustoryId=[]
      }else{
        this.selectedMinorIndustoryId =
      this.regulationSetupModel?.industry
        ?.flatMap(
          (majorIndustry: RegulationMajorIndustry | null) =>
            majorIndustry?.minorIndustries?.map(
              (minorIndustry: RegulationMinorIndustry) =>
                minorIndustry.minorIndustryId
            ) || []
        )
        .filter((id): id is number => id !== undefined) || [];
      }


    this.minorIndustoryTreeNode = [... this.transformToMinorTreeNode(minorIndustoryItem!,
      this.selectedMinorIndustoryId!)];

    console.log("minorIndustoryTreeNode", this.minorIndustoryTreeNode);
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

  bindTOBs() {
    this.TOBTreeNode = [];
    var selectedTOBIds: number[] = [];
    if (this.ActionType !== 'Create') {
      selectedTOBIds =
        this.regulationSetupModel?.industry
          ?.flatMap((major: any) =>
            major.minorIndustries?.flatMap((minor: any) =>
              minor.toBs?.map((tob: any) => tob.tobId) || []
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
      selectedTOBIds!
    );
  }

  // bindTOBs() {
  //   this.TOBTreeNode = [];
  //   var selectedTOBIds: number[] = [];
  //   if (this.ActionType == 'Edit') {
  //     selectedTOBIds = this.tocModel?.tobList?.map((f: RegulationTOBList) => f.tobId!) || [];
  //   }
  //   // var selectedTOBIds = this.regulationSetupModel?.industry
  //   //   ?.flatMap((majorIndustry: RegulationMajorIndustry | null) =>
  //   //     majorIndustry?.minorIndustries?.flatMap((minorIndustry: RegulationMinorIndustry) =>
  //   //       minorIndustry!.toBs!.map((tob: RegulationTOB) => tob.tobId)
  //   //     ) || []
  //   //   )
  //   //   .filter((id): id is number => id !== undefined) || [];

  //   this.TOBTreeNode = this.transformToTOBMinorTreeNode(this.regulationSetupModel?.industry!, selectedTOBIds!);
  // }

  transformToTOBMinorTreeNode(data: any[], param: number[]): TreeNode[] {
    const minorIndustryMap = new Map<number, TreeNode>();

    data.forEach((element) => {
      // Iterate through the Minor Industries for each Major Industry
      element.minorIndustries.forEach((minorIndustry: any) => {
        if (!minorIndustry.minorIndustryId) {
          return; // Skip if minorIndustryId is missing
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

  // transformToTOBMinorTreeNode(data: RegulationTOB[], param: number[]): TreeNode[] {
  //   const tobList = new Map<number, TreeNode>();

  //   data.forEach(item => {
  //     const childChecked = param && param.length > 0 ? param.includes(item.tobId!) : false;
  //     const childNode: TreeNode = {
  //       name: item.tobName || `TOB ${item.tobId}`,
  //       id: item.tobId!,
  //       checked: childChecked,  // Mark as checked based on the param array
  //       children: []  // Children are empty for now
  //     };

  //     tobList.set(item.tobId!, childNode);
  //   });

  //   // Return only the flat list of TOBs
  //   return Array.from(tobList.values());
  // }

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

  LoadData(step: number) {
    const rules = this.tocModel!;
    if (rules) {
      if (rules.tocDues) {
        this.bindPaymentModel();
        // Patch new fields if present in first tocDues
        if (rules.tocDues.length > 0) {
          this.formDues.patchValue({
            duesReferenceCode: rules.tocDues[0].duesReferenceCode || '',
            sectionNameofDues: rules.tocDues[0].sectionNameofDues || ''
          });
        }
      }
      if (rules.tocIntrestPenality && rules.tocIntrestPenality.length > 0) {
        const interestPenalty = rules.tocIntrestPenality[0];
        this.formInterestPenalty.patchValue({
          sectionName: interestPenalty.sectionName,
          interestType: interestPenalty.intrestType,
          interestRate: interestPenalty.intrestRate?.toString(),
          interestRatePeriod: interestPenalty.intrestRateFrequency,
          period: interestPenalty.period,
          penaltyRate: interestPenalty.penalityRate?.toString(),
          penaltyRatePeriod: interestPenalty.penalityRateFrequency,
        });
      }
      if (rules.tocImprisonment && rules.tocImprisonment.length > 0) {
        const imprisonment = rules.tocImprisonment[0];
        this.formImprisonment.patchValue({
          sectionName: imprisonment.sectionName,
          durationType: imprisonment.durationType?.toString(),
          durationFrom: imprisonment.durationFrom?.toString(),
          durationTo: imprisonment.durationTo?.toString(),
          forWhom: imprisonment.forWhome,
        });
      }
      if (rules.tocParameter && rules.tocParameter.length > 0) {
        this.parametersvalues = rules.tocParameter;
        this.regulationSetupModel?.isParameterChecked == this.persistance.getSessionStorage("parameterchecked").value;
      }
    }
  }

  goToStep(step: number) {
    if (step == 0) {
      var tOCDueDates: TOCDueDates[] = [];
      this.dueDates.forEach(element => {
        tOCDueDates.push({ label: element.label, dueDate: element.dueDate });
      });
      var dues: TOCDues = {
        frequency: this.formDues.controls['frequency'].value,
        id: this.formDues.controls['id'].value,
        forTheMonth: this.formDues.controls['month'].value,
        dueDate: this.formDues.controls['dueDate'].value,
        tocDueDates: tOCDueDates,
        duesReferenceCode: this.formDues.controls['duesReferenceCode'].value,
        sectionNameofDues: this.formDues.controls['sectionNameofDues'].value
      };
      if (!this.tocModel) {
        this.tocModel = {};
      }
      var rule = this.tocModel;
      // Attach dues fields to first row if using mainForm array
      if (Array.isArray(this.mainForm.value.rows) && this.mainForm.value.rows.length > 0) {
        this.mainForm.value.rows[0].duesReferenceCode = dues.duesReferenceCode;
        this.mainForm.value.rows[0].sectionNameofDues = dues.sectionNameofDues;
      }
      if (rule) {
        rule.tocDues = this.mainForm.value.rows;
      } else {
        rule = { ruleType: this.ruleType!, tocDues: this.mainForm.value.rows };
        this.tocModel = rule;
      }
    } else if (step == 1) {
      var intrestPenalities: TOCIntrestPenality = {
        id: 0,
        registrationId: 0,
        sectionName: this.formInterestPenalty.controls['sectionName'].value!,
        intrestType: this.formInterestPenalty.controls['interestType'].value!,
        intrestRate: Number(this.formInterestPenalty.controls['interestRate'].value!),
        intrestRateFrequency: this.formInterestPenalty.controls['interestRatePeriod'].value!,
        period: this.formInterestPenalty.controls['period'].value!,
        penalityRate: Number(this.formInterestPenalty.controls['penaltyRate'].value!),
        penalityRateFrequency: this.formInterestPenalty.controls['penaltyRatePeriod'].value!,
        createdOn: new Date(),
        createdBy: 1,
        modifiedBy: 1,
        modifiedOn: new Date(),

      };
      if (!this.tocModel) {
        this.tocModel = {};
      }
      if (!this.tocModel) {
        this.tocModel = {};
      }
      var rule = this.tocModel;
      if (rule) {
        if (!rule!.tocIntrestPenality) {
          rule!.tocIntrestPenality = [];
        }
      }
      rule!.tocIntrestPenality = [];
      rule!.tocIntrestPenality!.push(intrestPenalities);
    } else if (step == 2) {

      var imprisonment: TOCImprisonment = {
        id: Number(this.formImprisonment.controls['id'].value!),
        registrationId: 0,
        sectionName: this.formImprisonment.controls['sectionName'].value!,
        durationType: this.formImprisonment.controls['durationType'].value!,
        durationFrom: Number(this.formImprisonment.controls['durationFrom'].value!),
        durationTo: Number(this.formImprisonment.controls['durationTo'].value!),
        forWhome: this.formImprisonment.controls['forWhom'].value!,
        createdOn: new Date(),
        createdBy: this.persistance.getUserId()!,
      };
      var rule = this.tocModel!;
      if (!rule!.tocImprisonment) {
        rule!.tocImprisonment = [];
      }
      rule!.tocImprisonment = [];
      rule!.tocImprisonment.push(imprisonment);

      // if (!rule!.tocParameter && !rule?.tocParameter) {
      //   rule!.tocParameter = [];
      //   this.parametersvalues = rule?.tocParameter!;
      // }
      // if(this.ActionType == 'Create' && this.isParameterChecked){
      //   this.currentStep = 0;
      //   return;
      // }
    }
    else if (step == 3) {
      var rule = this.tocModel!;
      if (!rule!.tocParameter) {
        rule!.tocParameter = [];
      }

      rule!.tocParameter = this.parametersvalues;

    }
    this.currentStep = step + 1;
    if (this.currentStep == 4) {
      this.currentStep = 0;
    }
  }

  // frequency: string = 'monthly';
  // month: string | null = null;
  // dueDate: string | null = null;
  dueDates: TOCDueDates[] = [];

  onFrequencyChange(event: any) {
    // Reset the due dates when frequency changes
    this.dueDates = [];
  }

  addDueDate() {
    if (this.formDues.controls['month'].value && this.formDues.controls['dueDate'].value) {
      const startMonth = new Date(this.formDues.controls['month'].value);
      const due = new Date(this.formDues.controls['dueDate'].value);
      let datesToAdd = this.calculateDueDates(this.formDues.controls['frequency'].value, startMonth, due);
      this.dueDates.push(...datesToAdd);
    }
  }

  calculateDueDates(frequency: string, startMonth: Date, dueDate: Date): TOCDueDates[] {
    let dates: TOCDueDates[] = [];
    let start = new Date(startMonth);
    let due = new Date(dueDate);


    switch (frequency.toLocaleLowerCase()) {
      case 'monthly':
        for (let i = 0; i < 12; i++) {
          dates.push({ label: this.formatDate(start), dueDate: new Date(due) });
          start.setMonth(start.getMonth() + 1);
          due.setMonth(due.getMonth() + 1);
        }
        break;
      case 'quarterly':
        for (let i = 0; i < 4; i++) {
          dates.push({ label: this.formatDate(start), dueDate: new Date(due) });
          start.setMonth(start.getMonth() + 3);
          due.setMonth(due.getMonth() + 3);
        }
        break;
      case 'half-yearly':
        for (let i = 0; i < 2; i++) {
          dates.push({ label: this.formatDate(start), dueDate: new Date(due) });
          start.setMonth(start.getMonth() + 6);
          due.setMonth(due.getMonth() + 6);
        }
        break;
      case 'yearly':
        dates.push({ label: this.formatDate(start), dueDate: new Date(due) });
        break;
      case 'one-time':
        dates.push({ label: this.formatDate(start), dueDate: new Date(due) });
        break;
    }

    return dates;
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { year: '2-digit', month: 'short' };
    return date.toLocaleDateString('en-US', options);
  }

  removeDueDate(index: number) {
    this.dueDates.splice(index, 1);
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
    console.log(this.regulationparametersvalues);
  }

  onFormValidityChange(isValid: boolean): void {
    this.formIsValid = isValid;
    console.log('Form is valid:', this.formIsValid);
  }

  saveChanges() {

    if (this.currentStep == 4) {
      this.currentStep = 0;
    }
    this.goToStep(this.currentStep);
    if (this.tocModel) {
      this.tocModel.ruleType = this.ruleType;
      this.tocModel.managerId = this.persistance.getManagerId();
      this.tocModel.createdBy = this.persistance.getUserId()!;
      this.tocModel.complianceId = this.complianceId == 0 ? null : this.complianceId;
      this.tocModel.regulationSetupId = this.regulationSetupId == 0 ? null : this.regulationSetupId;
      this.tocModel.tobs = [];
      this.tocModel.tobs = this.getCheckedChildIds(this.TOBTreeNode);
      var MajorIndustoryId: Array<number> = [];
      this.formImprisonment!.get('majorIndustryId')!.value!.forEach((param: any) => {
        MajorIndustoryId.push(param.majorIndustryId);
      });
      this.tocModel.industry = [];
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
        this.tocModel!.industry?.push(major);
      });
      var legalEntityTypeId: Array<number> = [];
      this.formImprisonment!.get('entityTypeId')!.value!.forEach((param: any) => {
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
       this.tocModel.concernedMinistryId=Number(this.formImprisonment.get('concernedMinistryId')!.value);
      this.tocModel.regulatoryAuthorityId=Number(this.formImprisonment.get('regulatoryAuthorityId')!.value);
            this.tocModel.legalEntityType = selectedLegalEntityTypes;
      this.regulationSetup.addTOCRules(this.tocModel!).subscribe((result: any) => {
        if (result.responseCode === 1) {
          this.notifier.notify("success", result.responseMessage);
          this.reloaddata.emit('reload');
        } else {
          this.notifier.notify("error", result.responseMessage);
        }
      }, (error: any) => {
        this.notifier.notify("error", "Something went wrong");
      });
    }
  }

  acceptSelectedRequests() {
    var model: accessModel = {
      managerId: this.persistance.getManagerId(),
      createdBy: this.persistance.getUserId()!,
      uid: this.tocRulesHistory.approverUID,
    };

    this.regulationSetup.TOCRulesApproved(model!).subscribe((result: ResponseModel) => {
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
      uid: this.tocRulesHistory.approverUID,
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

  reset() {
    this.modalService.dismissAll();
  }



  // ---------------- Flat salb chagnes 

  frequencyForm: FormGroup;


  mainForm: FormGroup;
  get rows(): FormArray {
    return this.mainForm.get('rows') as FormArray;
  }

  months = [
    { name: 'January', value: 'January' },
    { name: 'February', value: 'February' },
    { name: 'March', value: 'March' },
    { name: 'April', value: 'April' },
    { name: 'May', value: 'May' },
    { name: 'June', value: 'June' },
    { name: 'July', value: 'July' },
    { name: 'August', value: 'August' },
    { name: 'September', value: 'September' },
    { name: 'October', value: 'October' },
    { name: 'November', value: 'November' },
    { name: 'December', value: 'December' }
  ];

  periodOptions = [
    { name: 'Monthly', value: 'Monthly' },
    { name: 'Quarterly', value: 'Quarterly' },
    { name: 'Half Yearly', value: 'Half-Yearly' },
    { name: 'Yearly', value: 'Yearly' },
    { name: 'One Time', value: 'One-Time' }
  ];

  originalFormValue: any = [];


  addRow() {
    var FlatFrequency = false;
    var frequencytype = this.frequencyForm.get('frequencytype')!.value
    if (frequencytype == 'FlatFrequency') {
      FlatFrequency = true;
    }
    // Restrict if FlatFrequency and already has a row
    const activeRows = this.getMainRows().controls.filter(row => row.get('status')?.value === true);

    if (frequencytype === 'FlatFrequency' && activeRows.length >= 1) {
      alert('Only one active row is allowed for Flat Frequency.');
      return;
    }
    this.rows.push(this.fb.group({
      id: ['0'],
      frequencytype: [frequencytype, Validators.required],
      fromTrunOver: [{ value: '', disabled: FlatFrequency }],
      toTrunOver: [{ value: '', disabled: FlatFrequency }],
      frequency: [''],
      showSubTable: [false],
      status: [true],
      tocDueDates: this.fb.array([])
    }));
    this.onFrequencyTypeChange();

    //this.originalFormValue = JSON.parse(JSON.stringify(this.mainForm.value));
  }
  onFrequencyTypeChange() {
    this.frequencyForm.get('frequencytype')!.valueChanges.subscribe((newValue) => {
      const mainRows = this.getMainRows();

      // Capture original frequencytype before it is overwritten
      if (this.originalFormValue) {
        const originalFrequency = this.originalFormValue?.rows?.[0]?.frequencytype;

        if (!originalFrequency || newValue !== originalFrequency) {
          // Frequency changed → mark all status fields as false
          mainRows.controls.forEach(row => {
            row.patchValue({ status: false });

            const tocDueDates = row.get('tocDueDates') as FormArray;
            tocDueDates.controls.forEach(subRow => {
              subRow.patchValue({ status: false });

              const tocDueMonths = subRow.get('tocDueMonths') as FormArray;
              tocDueMonths?.controls.forEach(monthRow => {
                monthRow.patchValue({ status: false });
              });
            });
          });
        } else {
          // Frequency reverted → restore original statuses from backup
          this.originalFormValue.rows.forEach((origRow: any, rowIndex: number) => {
            const currentRow = mainRows.at(rowIndex) as FormGroup;
            currentRow.patchValue({ status: origRow.status });

            const tocDueDates = currentRow.get('tocDueDates') as FormArray;
            origRow.tocDueDates?.forEach((origSubRow: any, subIndex: number) => {
              const currentSubRow = tocDueDates.at(subIndex) as FormGroup;
              currentSubRow.patchValue({ status: origSubRow.status });

              const tocDueMonths = currentSubRow.get('tocDueMonths') as FormArray;
              origSubRow.tocDueMonths?.forEach((origMonthRow: any, monthIndex: number) => {
                const currentMonthRow = tocDueMonths.at(monthIndex) as FormGroup;
                currentMonthRow.patchValue({ status: origMonthRow.status });
              });
            });
          });
        }
      }
    });
  }




  toggleSubTable(row: FormGroup) {
      if (this.financialYearStartMonth && row.get('forTheMonth')) {
        const financialMonth = new Date(this.financialYearStartMonth);

        const selectedMonthName = this.months[financialMonth.getMonth()];
       row.get('forTheMonth')?.setValue(selectedMonthName);
            }
    row.patchValue({ showSubTable: !row.value.showSubTable });
  }

  getSubRows(row: FormGroup): FormArray {
    return row.get('tocDueDates') as FormArray
  }
  getVisibleMainRows(): AbstractControl[] {
    return this.getMainRows().controls.filter(row => row.get('status')?.value === true);
  }
  getVisibleSubRows(row: FormGroup): AbstractControl[] {
    return this.getSubRows(row).controls.filter(ctrl => ctrl.get('status')?.value === true);
  }

  getMainRows(): FormArray {
    return this.mainForm.get('rows') as FormArray;
  }

  addSubRow(row: FormGroup, subFrequency?: string | null) {
    const subRows = this.getSubRows(row);
    const parentRowIndex = this.getMainRows().controls.indexOf(row);

    // Determine frequency
    if (!subFrequency) {
      subFrequency =
        subRows.length > 0
          ? subRows.at(0).get('frequencytype')?.value || 'FlatFrequency'
          : 'FlatFrequency';
    }

    const isFlat = subFrequency === 'FlatFrequency';

    // Restrict to only one active sub-row for FlatFrequency
    const activeSubRows = subRows.controls.filter(ctrl => ctrl.get('status')?.value === true);
    if (isFlat && activeSubRows.length >= 1) {
      alert('Only one sub-row is allowed for Flat Frequency.');
      return;
    }

    const subRow = this.fb.group({
      id: ['0'],
      frequencytype: [subFrequency, Validators.required],
      fromTrunOver: [{ value: '', disabled: isFlat }],
      toTrunOver: [{ value: '', disabled: isFlat }],
      forTheMonth: [''],
      dueDate: [''],
      status: [true],
      tocDueMonths: this.fb.array([])
    });
    // Set the financial year start month as default if available
    if (this.financialYearStartMonth) {
      const financialMonth = new Date(this.financialYearStartMonth);
      const selectedMonthName = this.months[financialMonth.getMonth()];
      subRow.get('forTheMonth')?.setValue(selectedMonthName.value);
    }
    this.attachSubRowFrequencyChangeHandler(subRow, row, parentRowIndex);
    subRows.push(subRow);
  }

  private attachSubRowFrequencyChangeHandler(subRow: FormGroup, row: FormGroup, parentRowIndex: number): void {
    subRow.get('frequencytype')!.valueChanges.subscribe((newFreq) => {

      const subRows = this.getSubRows(row);
      const originalSubRows = this.originalFormValue?.rows?.[parentRowIndex]?.tocDueDates || [];
      const originalFreq = originalSubRows[0]?.frequencytype;

      // Remove dynamic subRows
      for (let i = subRows.length - 1; i >= 0; i--) {
        if (subRows.at(i).get('id')?.value === '0') {
          subRows.removeAt(i);
        }
      }

      if (originalFreq === newFreq) {
        originalSubRows.forEach((origSub: any) => {
          const shouldDisable = newFreq === 'FlatFrequency';
          const restoredSubRow = this.fb.group({
            id: [origSub.id],
            frequencytype: [newFreq],
            fromTrunOver: [{ value: origSub.fromTrunOver, disabled: shouldDisable }],
            toTrunOver: [{ value: origSub.toTrunOver, disabled: shouldDisable }],
            forTheMonth: [origSub.forTheMonth],
            dueDate: [origSub.dueDate],
            status: [origSub.status],
            tocDueMonths: this.fb.array([])
          });

          const monthArray = restoredSubRow.get('tocDueMonths') as FormArray;
          (origSub.tocDueMonths || []).forEach((month: any) => {
            monthArray.push(this.fb.group({
              id: [month.id],
              parentTocDueDateId: [month.parentTocDueDateId],
              frequencytype: [month.frequencytype],
              fromTrunOver: [month.fromTrunOver],
              toTrunOver: [month.toTrunOver],
              forTheMonth: [month.forTheMonth],
              dueDate: [month.dueDate],
              label: [month.label],
              status: [month.status]
            }));
          });

          this.attachSubRowFrequencyChangeHandler(restoredSubRow, row, parentRowIndex);
          subRows.push(restoredSubRow);
        });

        this.addSubRow(row, newFreq);
      } else {
        originalSubRows.forEach((origSub: any) => {
          const shouldDisable = newFreq === 'FlatFrequency';
          const modifiedSubRow = this.fb.group({
            id: [origSub.id],
            frequencytype: [newFreq],
            fromTrunOver: [{ value: origSub.fromTrunOver, disabled: shouldDisable }],
            toTrunOver: [{ value: origSub.toTrunOver, disabled: shouldDisable }],
            forTheMonth: [origSub.forTheMonth],
            dueDate: [origSub.dueDate],
            status: [false],
            tocDueMonths: this.fb.array([])
          });

          const monthArray = modifiedSubRow.get('tocDueMonths') as FormArray;
          (origSub.tocDueMonths || []).forEach((month: any) => {
            monthArray.push(this.fb.group({
              id: [month.id],
              parentTocDueDateId: [month.parentTocDueDateId],
              frequencytype: [month.frequencytype],
              fromTrunOver: [month.fromTrunOver],
              toTrunOver: [month.toTrunOver],
              forTheMonth: [month.forTheMonth],
              dueDate: [month.dueDate],
              label: [month.label],
              status: [false]
            }));
          });

          this.attachSubRowFrequencyChangeHandler(modifiedSubRow, row, parentRowIndex);
          subRows.push(modifiedSubRow);
        });

        this.addSubRow(row, newFreq);
      }
    });
  }



  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  logData() {
    console.log(this.mainForm.value);
  }


  removeRow(row: FormGroup, index: number): void {
    row.patchValue({ status: false });

    const tocDueDates = row.get('tocDueDates') as FormArray;
    tocDueDates.controls.forEach(dueDateControl => {
      dueDateControl.patchValue({ status: false });

      const tocDueMonths = dueDateControl.get('tocDueMonths') as FormArray;
      tocDueMonths?.controls.forEach(monthControl => {
        monthControl.patchValue({ status: false });
      });
    });
  }


  removeSubRow(subRow: FormGroup, index: number): void {
    subRow.patchValue({ status: false });

    const tocDueMonths = subRow.get('tocDueMonths') as FormArray;
    tocDueMonths?.controls.forEach(monthControl => {
      monthControl.patchValue({ status: false });
    });
  }



  bindPaymentModel() {
    if (this.tocModel!.tocDues!.length > 0) {
      this.frequencyForm.patchValue({
        frequencytype: this.tocModel!.tocDues![0].frequencyType
      });
    }

    this.tocModel!.tocDues!.forEach((item, mainIndex) => {
      const rowGroup = this.fb.group({
        id: [item.id],
        frequencytype: [item.frequencyType, Validators.required],
        fromTrunOver: [{ value: item.fromTrunOver, disabled: false }],
        toTrunOver: [{ value: item.toTrunOver, disabled: false }],
        frequency: [item.frequency],
        showSubTable: [true],
        status: [item.status],
        tocDueDates: this.fb.array([])
      });

      const tocDueDatesArray = rowGroup.get('tocDueDates') as FormArray;

      item.tocDueDates!.forEach((due, subIndex) => {
        const isFlat = due.frequencyType === 'FlatFrequency';
        const subRowGroup = this.fb.group({
          id: [due.id],
          frequencytype: [due.frequencyType, Validators.required],
          fromTrunOver: [{ value: due.fromTrunOver, disabled: isFlat }],
          toTrunOver: [{ value: due.toTrunOver, disabled: isFlat }],
          forTheMonth: [due.forTheMonth],
          dueDate: [due.dueDate?.toString().split('T')[0]],
          status: [due.status],
          tocDueMonths: this.fb.array([])
        });

        const tocDueMonthsArray = subRowGroup.get('tocDueMonths') as FormArray;

        due.tocDueMonths?.forEach((month: any) => {
          tocDueMonthsArray.push(this.fb.group({
            id: [month.id],
            parentTocDueDateId: [month.parentTocDueDateId],
            frequencytype: [month.frequencytype],
            fromTrunOver: [month.fromTrunOver],
            toTrunOver: [month.toTrunOver],
            forTheMonth: [month.forTheMonth],
            dueDate: [month.dueDate],
            label: [month.label],
            status: [month.status]
          }));
        });

        // Sub-row frequency change handler for reactive update
        subRowGroup.get('frequencytype')!.valueChanges.subscribe((newFreq) => {
          const originalSubRows = this.originalFormValue.rows[mainIndex]?.tocDueDates || [];
          const originalFreq = originalSubRows[0]?.frequencytype;

          // Clear subrows
          //  while (tocDueDatesArray.length > 0) tocDueDatesArray.removeAt(0);
          if (originalFreq == newFreq) {
            originalSubRows.forEach((origSub: any) => {
              const shouldDisable = newFreq === 'FlatFrequency';
              const subStatus = newFreq !== originalFreq ? false : origSub.status;

              const newSubRow = this.fb.group({
                id: [origSub.id],
                frequencytype: [newFreq, Validators.required],
                fromTrunOver: [{ value: origSub.fromTrunOver, disabled: shouldDisable }],
                toTrunOver: [{ value: origSub.toTrunOver, disabled: shouldDisable }],
                forTheMonth: [origSub.forTheMonth],
                dueDate: [origSub.dueDate],
                status: [subStatus],
                tocDueMonths: this.fb.array([])
              });

              const newMonths = newSubRow.get('tocDueMonths') as FormArray;

              origSub.tocDueMonths?.forEach((month: any) => {
                newMonths.push(this.fb.group({
                  id: [month.id],
                  parentTocDueDateId: [month.parentTocDueDateId],
                  frequencytype: [month.frequencytype],
                  fromTrunOver: [month.fromTrunOver],
                  toTrunOver: [month.toTrunOver],
                  forTheMonth: [month.forTheMonth],
                  dueDate: [month.dueDate],
                  label: [month.label],
                  status: [newFreq !== originalFreq ? false : month.status]
                }));
              });

              tocDueDatesArray.push(newSubRow);
            });
          }
          else {
            const currentRow = this.getMainRows().at(mainIndex) as FormGroup;
            const originalRow = this.originalFormValue.rows[mainIndex];

            // Make sure tocDueDates exists on both current and original
            const tocDueDates = currentRow.get('tocDueDates') as FormArray;
            const originalDueDates = originalRow?.tocDueDates || [];

            originalDueDates.forEach((origSubRow: any, subIndex: number) => {
              const currentSubRow = tocDueDates.at(subIndex) as FormGroup;

              // Set status from original
              currentSubRow.patchValue({ status: false });

              // Handle months
              const tocDueMonths = currentSubRow.get('tocDueMonths') as FormArray;
              const originalMonths = origSubRow.tocDueMonths || [];

              originalMonths.forEach((origMonthRow: any, monthIndex: number) => {
                const currentMonthRow = tocDueMonths.at(monthIndex) as FormGroup;

                // Set month status from original
                currentMonthRow.patchValue({ status: false });
              });
            });
            this.addSubRow(this.asFormGroup(this.getMainRows().at(mainIndex)), newFreq);
          }
        });

        tocDueDatesArray.push(subRowGroup);
      });

      this.getMainRows().push(rowGroup);
    });

    //  Save original form state after binding
    this.originalFormValue = JSON.parse(JSON.stringify(this.mainForm.value));
  }


  getTocDueMonths(subRow: FormGroup): FormArray {
    return subRow.get('tocDueMonths') as FormArray;
  }

  getVisibleTocDueMonths(subRow: FormGroup): AbstractControl[] {
    return this.getTocDueMonths(subRow).controls.filter(ctrl => ctrl.get('status')?.value === true);
  }

  addTocDueMonth(subRow: FormGroup, subFrequency: string, row: FormGroup) {
    if (!subRow.get('dueDate')!.value) {
      alert('Due Date is Required')
      return;
    }
    const selectedMonth = subRow.get('forTheMonth')!.value; // e.g., "March"
    const currentYear = new Date().getFullYear();

    // Convert month name to number (0 = Jan, 1 = Feb, ..., 11 = Dec)
    const monthIndex = new Date(`${selectedMonth} 1, ${currentYear}`).getMonth();

    var startMonth = new Date(currentYear, monthIndex, 1);
    //var startMonth = new Date(subRow.get('forTheMonth')!.value);
    var due = new Date(subRow.get('dueDate')!.value);
    var frequency = row.get('frequency')!.value;
    let datesToAdd = this.calculateDueDates(frequency, startMonth, due);
    datesToAdd.forEach(element => {
      const monthRow = this.fb.group({
        id: ['0'],
        parentTocDueDateId: ['0'],
        frequencytype: [subRow.get('frequencytype')!.value, Validators.required],
        fromTrunOver: [subRow.get('fromTrunOver')!.value],
        toTrunOver: [subRow.get('toTrunOver')!.value],
        forTheMonth: subRow.get('forTheMonth')!.value,
        dueDate: [element.dueDate],
        label: [element.label],
        status: [true]
      });
      this.getTocDueMonths(subRow).push(monthRow);
     
    });


    // Optional frequencytype observer (like addSubRow)
    subRow.get('frequencytype')!.valueChanges.subscribe((value) => {
      while (this.getTocDueMonths(subRow).length !== 0) {
        this.getTocDueMonths(subRow).removeAt(0);
      }
      this.addTocDueMonth(subRow, value, row);
    });



  }

  removeTocDueMonth(monthRow: FormGroup, index: number): void {
    monthRow.patchValue({ status: false });
  }

    GetMinorIndustrybyMajorIDMap(event: any) {
    setTimeout(() => {
      var MajorIndustoryId: Array<number> = [];
      const majorIndustryControl = this.formImprisonment.get('majorIndustryId');
      if (majorIndustryControl && majorIndustryControl.value) {
        majorIndustryControl.value.forEach((param: any) => {
          MajorIndustoryId.push(param.majorIndustryId);
        });
      }
      this.regulationSetup
        .GetMinorIndustrybyMajorIDMap(
          MajorIndustoryId,
          this.regulationSetupModel?.countryId!
        )
        .subscribe((result: MajorMinorMapping[]) => {
          //this.majorMinorMapping = result;
          this.minorIndustoryTreeNode = [];
 
          this.selectedMinorIndustoryId =
            this.tocModel?.industry
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
  
  
       const majorIndustryControl = this.formImprisonment.get('majorIndustryId');
      if (majorIndustryControl && majorIndustryControl.value) {
        majorIndustryControl.value.forEach((param: any) => {
          MajorIndustoryId.push(param.majorIndustryId);
        });
      }
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
            this.tocModel?.industry
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
    

  onNodeSelect(event: any) {
    console.log(event);
    this.selectedMinorIndustoryId = this.getCheckedChildIds(event);
    this.GetTOBMinorIndustryMap();
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



    generateComplianceDueRefCode(event: any) {
    let name = event.target.value;
    const firstThree = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const nextCode =
      this.formDues.get('duesReferenceCode')?.value || '';
    const firstNumberMatch = nextCode.match(/\d+/);
    const firstNumber = firstNumberMatch ? firstNumberMatch[0] : '';
    const code = `${firstThree}${firstNumber}`;
    this.formDues
      .get('duesReferenceCode')
      ?.setValue(code);
    this.formDues.get('duesReferenceCode')?.disable();
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
