import { ConcernedMinistry } from "./postConcernedMinistry";
import { RegulatoryAuthorities } from "./postRegulatoryAuthorities";
import { RegSetupComplianceParameterHistory, RegulationMajorIndustry, RegulationSetupLegalEntityType, RegulationTOB } from "./regulationsetupModel";
import { ResponseModel } from "./responseModel";

export interface TOCRegistration extends ResponseModel{
    id?: number; 
    complianceId?:number  | null;
    regulationSetupId?:number | null;
    registrationName?: string;
    description?: string;
    createdOn?: Date;
    createdBy?: number;
    modifiedBy?: number;
    modifiedOn?: Date;
    uid?: string;
    managerId?:number;
    historyId?:number;
    ruleType?:string;
    tocDocument?:TOCDocuments[];
    tocParameter?:TOCParameter[];
    tobs?:number [] | null;
    tobList?: RegulationTOB[];
    sectionNameOfRegister?: string;
    regulationSetupTypeOfComplianceRegisterRC?: string;  
      parameters?: RegSetupComplianceParameterHistory[] | null;
    industry?: RegulationMajorIndustry[];  
    legalEntityType?: RegulationSetupLegalEntityType[];  
    regulatoryAuthorityId?: number | null;
    concernedMinistryId?: number | null;   
}
export interface TOC{
    complianceId?:number
    tOCRegistration?:TOCRegistration
    tOCRules?:TOCRules[];

}

export interface TOCRules{
    ruleType?:string
    tocDues?:TOCDues[];
    complianceId?:number | null;
    regulationSetupId?:number | null
    tocIntrestPenality?:TOCIntrestPenality[];
    tocImprisonment?:TOCImprisonment[];
    tocParameter?:TOCParameter[];
    managerId?:number;
    historyId?:number;
    createdOn?: Date;
    createdBy?: number;
    modifiedBy?: number;
    modifiedOn?: Date;
    tobs?:number [] | null;
    tobList?: RegulationTOB[];
    industry?:RegulationMajorIndustry [] | null;
   legalEntityType?: RegulationSetupLegalEntityType[];
   concernedMinistryId?:number| null;
   regulatoryAuthorityId?:number | null;
   regulatoryAuthority?:RegulatoryAuthorities[]|[];
    concernedMinistry?:ConcernedMinistry[]|[];
}

export interface TOCDocuments {
    id?: number;
    tocRegistrationId?: number;
    documentName?: string;
    status?: boolean;
    createdOn?: Date;
    createdBy?: number;
    modifiedBy?: number;
    modifiedOn?: Date;
    uid?: string;
}

export interface TOCDues {
    id?: number;
    registrationId?: number;
    frequency?: string;
    frequencyType?: string;
    fromTrunOver?: string;
    toTrunOver?: string;
    forTheMonth?: Date;
    dueDate?: Date;
    createdOn?: Date;
    createdBy?: number;
    modifiedBy?: number;
    modifiedOn?: Date;
    uid?: string;
    tocDueDates?:TOCDueDates[];
    status?:boolean;
    sectionNameofDues?: string;
    duesReferenceCode?: string;
}

export interface TOCDueDates {
    id?: number;
    tocDuesId?: number;
    label:string;
    dueDate?: Date;
    createdOn?: Date;
    createdBy?: number;
    modifiedBy?: number;
    modifiedOn?: Date;
    uid?: string;
    frequencyType?: string;
    fromTrunOver?: string;
    toTrunOver?: string;
    forTheMonth?: Date;
    status?:boolean;
    tocDueMonths?:TOCDueDates [];
    parentTocDueDateId?: number;
}

export interface TOCImprisonment {
    id: number;
    registrationId?: number;
    sectionName?: string;
    durationType?: string;
    durationFrom?: number;
    durationTo?: number;
    forWhome?: string;
    createdOn?: Date;
    createdBy?: number;
    modifiedBy?: number;
    modifiedOn?: Date;
    uid?: string;
}

export interface TOCParameter {
    id: number;
    registrationId?: number;
    parameterTypeId?: number;
    parameterTypeValue?: string;
    parameterOperator?: string;
    sequence?: number;
    status?: number;
    createdOn?: Date;
    createdBy?: number;
    modifiedBy?: number;
    modifiedOn?: Date;
    uid?: string;
}



export interface TOCIntrestPenality {
    id: number;
    registrationId?: number;
    sectionName?: string;
    intrestType?: string;
    intrestRate?: number;
    intrestRateFrequency?: string;
    period?: string;
    penalityRate?: number;
    penalityRateFrequency?: string;
    createdOn?: Date;
    createdBy?: number;
    modifiedBy?: number;
    modifiedOn?: Date;
    uid?: string;
}
