import { ResponseModel } from "./responseModel";

export interface TOCRegistration extends ResponseModel{
    id?: number; 
    complianceId?:number;
    regulationSetupId?:number;
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
}
export interface TOC{
    complianceId?:number
    tOCRegistration?:TOCRegistration
    tOCRules?:TOCRules[];

}

export interface TOCRules{
    ruleType?:string
    tocDues?:TOCDues;
    complianceId?:number;
    regulationSetupId?:number;
    tocIntrestPenality?:TOCIntrestPenality[];
    tocImprisonment?:TOCImprisonment[];
    tocParameter?:TOCParameter[];
    managerId?:number;
    historyId?:number;
    createdOn?: Date;
    createdBy?: number;
    modifiedBy?: number;
    modifiedOn?: Date;

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
    forTheMonth?: Date;
    dueDate?: Date;
    createdOn?: Date;
    createdBy?: number;
    modifiedBy?: number;
    modifiedOn?: Date;
    uid?: string;
    tocDueDates?:TOCDueDates[];
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
