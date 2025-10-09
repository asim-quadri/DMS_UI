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
    createdOn?: string | null;
    createdBy?: number | null;
    modifiedOn?: string | null;
    modifiedBy?: number | null;
    uid?: string | null;
    managerId?: any | null;
    ApprovalUID?: string | null;
    approvalManagerId?: number;
    historyId?: number;
    regulationSetupParameters?: RegSetupParameterHistory[] | null;
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
    id: number;
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
    approvalManagerId?: number;
    historyId?: number;
    regulationSetupParameters?: RegSetupParameterHistory[] | null;
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
    parameters?: RegSetupComplianceParameterHistory[] | null;
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