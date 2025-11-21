import { ConcernedMinistry } from "./postConcernedMinistry";
import { RegulatoryAuthorities } from "./postRegulatoryAuthorities";
import { ResponseModel } from "./responseModel";

export interface RegulationSetupDetailsModel extends ResponseModel {
    id?: number | null;
    majorIndustryId?: number | null;
    minorIndustryId?: number | null;
    regulationGroupId?: number | null;
    regulationType?: string | null;
    regulationName?: string | null;
    description?: string | null;
    status?: number | null;
    countryId?:number | null;
    createdOn?: string | null;
    createdBy?: number | null;
    modifiedOn?: string | null;
    modifiedBy?: number | null;
    uid?: string | null;
    managerId?: any | null;
    ApprovalUID?: string | null;
    approvalManagerId?: number;
    historyId?: number;
    isParameterChecked?: boolean;
    regulationSetupParameters?: RegSetupParameterHistory[] | null;
    ruleType?:string;
    industry?:RegulationMajorIndustry [] | null;
    tobList?: RegulationTOB[];
    regulationSetupDetailsReferenceCode?: string | null;
    legalEntityType?:RegulationSetupLegalEntityType [] | null;
    regulatoryAuthorityId?: number | null;
    concernedMinistryId?: number | null;
    isConcernedAndAuthorityChecked?:boolean|false;
    concernedMinistry?:ConcernedMinistry[] | null;
    regulatoryAuthorities?:RegulatoryAuthorities[] | null;
    financialMonth?:Date
}


export interface RegulationTOB {
    tobId?: number;
    tobName?: string;
    checked?: boolean;
  }
  
  export interface RegulationMinorIndustry {
    minorIndustryId?: number;
    minorIndustryName?: string;
    majorIndustryId?:number;
    majorIndustryName?:string;
    toBs?: RegulationTOB[]; // List of TOBs under this Minor Industry
  }
  
  
  export interface RegulationMajorIndustry {
    majorIndustryId?: number;
    majorIndustryName?: string;
    minorIndustries?: RegulationMinorIndustry[]; // List of Minor Industries under this Major Industry
    toBs?: RegulationTOB[];
  }

  export interface RegulationTOBList {
    tobId?: number;
    tobName?: string;
  }
  

export interface RegulationSetupParameterModel extends ResponseModel {
    id: number;
    majorIndustryId: number | null;
    minorIndustryId: number | null;
    entityTypeId: number | null;
    parameterName: string | null;
    parameterType: string | null;
    parameterMode: string | null;
    status: number | null;
    createdOn: string | null;
    createdBy: number | null;
    modifiedOn: string | null;
    modifiedBy: number | null;
    uid: string | null;
    managerId: any | null;
    ApprovalUID: string | null;
}

export interface RegulationDetailsByCountryIdModel extends ResponseModel {
    id: number| null;
    countryId: number | null;
    countryName: string | null;
    stateId: number | null;
    stateName: string | null;
    regulationGroupId: number | null;
    regulationGroupName: string | null;
    majorIndustryId: number | null;
    majorIndustryName: string | null;
    minorIndustryId: number | null;
    minorIndustryName: string | null;
    entityTypeId: number | null;
    entityType: string | null;
    parameterType: string | null;
    parameterMode: string | null;
    regulationType: string | null;
    regulationName: string | null;
    description: string | null;
    status: number | null;
    createdOn: string | null;
    createdBy: number | null;
    modifiedOn: string | null;
    modifiedBy: number | null;
    uid: string | null;
    managerId: any | null;
    ApprovalUID: string | null;
    approvalManagerId?: number| null;
    historyId?: number| null;
    sequence?: number | null;
    isParameterChecked?: boolean;
    regulatoryAuthorityId?: number | null;
    concernedMinistryId?: number | null;
    isConcernedAndAuthorityChecked?:boolean|false;
    regulationSetupParameters?: RegSetupParameterHistory[] | null;
    regulationSetupDetailStateList?: RegSetupDetailsStateList[] | null;
    regulationSetupDetailsReferenceCode?: string | null;
    // majorIndustryIds?: number[] | null;
    // minorIndustryIds?: number[] | null;
    // tobIds?: RegulationTOB[] | null;

    industry?:RegulationMajorIndustry [] | null;
    legalEntityType?:RegulationSetupLegalEntityType [] | null;
    approvedBy?:string | null;
    addedBy?:string | null;
    regulationEffectiveDate?:string | null;
    inActiveDate?:string | null;
}

export interface RegulationSetupLegalEntityType {
  id?: number;
  regulationSetupId?: number;
  complianceId?: number;
  entityName?:string;
  legalEntityType?: number;
  createdOn?: Date;
  createdBy?: number;
  modifiedBy?: number;
  modifiedOn?: Date;
  uid?: string;
}

export interface RegSetupDetailsStateList extends ResponseModel {
    id?: number;
    stateId?: number;
    sequence?: number | null;
}

export interface RegSetupComplianceModel extends ResponseModel {
    id: number;
    historyId: number;
    parentComplianceId:number| null;
    regulationSetupId: number;
    regulationName?: string | null;
    complianceName?: string | null;
    description?: string | null;
    status?: number | null;
    createdOn?: Date | null;
    createdBy?: number | null;
    modifiedBy?: number | null;
    modifiedOn?: Date | null;
    uid?: string | null;
    managerId?: number | null;
    concernedMinistryId?: number | null;
    regulatoryAuthorityId?: number | null;
    isConcernedAndAuthorityChecked?:boolean|false;
    isParameterChecked?: boolean | null;
    regulationSetupUID?: string | null;
    parameters?: RegSetupComplianceParameterHistory[] | null;
    industry?:RegulationMajorIndustry [] | null;
    tobList?:RegulationTOBList[] | null;
    tobs?:number [] | null;
    majorIndustryId?: string | null;
    regulationSetupComplianceReferenceCode: string | null;
   legalEntityType?:RegulationSetupLegalEntityType []|[];
    sectionName?:string | null;
    concernedMinistry?:ConcernedMinistry[] | null;
    regulatoryAuthorities?:RegulatoryAuthorities[] | null;
}

export interface UserRegulationMapping {
  userId: number;
  countryIds: string;
  stateIds: string;
  regulationIds: string;
  regulationGroupId: string;
  complianceType: string;
  complianceId: string;
}


export interface RegSetupComplianceParameterHistory extends ResponseModel {
    id?: number;
    historyId?: number;
    regulationSetupComplianceId?: number | null;
    parameterType?: string | null;
    parameterTypeId?: number | null;
    parameterTypeValue?: string | null;
    parameterOperator?: string | null;
    sequence?: number | null;
    status?: number | null;
    isParameterChecked?: boolean | null;
    createdOn?: Date | null;
    createdBy?: number | null;
    modifiedBy?: number | null;
    modifiedOn?: Date | null;
    uid?: string | null;
}

export interface RegSetupParameterHistory extends ResponseModel {
    id?: number;
    historyId?: number;
    regulationSetupId?: number | null;
    parameterType?: string | null;
    parameterTypeId?: number | null;
    parameterTypeValue?: string | null;
    parameterOperator?: string | null;
    sequence?: number | null;
    status?: number | null;
    createdOn?: Date | null;
    createdBy?: number | null;
    modifiedBy?: number | null;
    modifiedOn?: Date | null;
    uid?: string | null;
}


export class ReuglationListModle {
    id?: number;
    regulationName?: string;
    ruleType?:string;
    regulationSetupUID?: string;
    regulationcheck?: number;
    compliance: ComplianceListModle[] = [];
    toc: TOCListModel[] = [];
    isParameterChecked?:boolean;
    isConcernedAndAuthorityChecked?:boolean;
    regulationSetupDetailsReferenceCode?: string | null;
    majorIndustryId?:string;
    visible:boolean = true;
}

export class ComplianceListModle {
    id?: number;
    complianceName?: string;
    ruleType?: string;
    complianceUID?: string;
    toc: TOCListModel[] = [];
    compliance:ComplianceListModle [] = [];
}

export class TOCListModel {
    id?: number;
    typeOfComplianceName?: string;
    ruleType?: string;
    typeOfComplianceUID?: string;
    typeOfComplianceId?: number;
}

export interface TOBMinorIndustryRequest {
    majorIndustryIds: number[];
    minorIndustryIds: number[];
    countryId: number;
  }