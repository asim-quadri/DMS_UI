import { ResponseModel } from "./responseModel";

export interface compliancetracker extends ResponseModel {

    ComplianceId: number;
    ForTheMonth: string | null;
    RegulationSetupId: number;
    TOCRuleType: string | null;
    Frequency: string | null;
    DueDate: any | null;
    DueAmount: any | null;
    AmountPaid: any | null;
    ActualDate: any | null;
    PayableAmount: any | null;
    Reason: string | null;
    CreatedOn: any | null;
    CreatedBy: any | null;
    ModifiedOn: any | null;
    ModifiedBy: any | null;
    UID: any | null;
}

export class ComplianceTrackerModel {

    ComplianceId: number | undefined;
    ForTheMonth: string | undefined;
    RegulationSetupId: number | undefined;
    TOCRuleType: string | undefined;
    Frequency: string | undefined;
    DueDate: any | null;
    DueAmount: Number | undefined;
    AmountPaid: Number | undefined;
    ActualDate: any | null;
    PayableAmount: Number | undefined;
    Reason: string | undefined;
    CreatedOn: any | null;
    CreatedBy: any | null;
    ModifiedOn: any | null;
    ModifiedBy: any | null;
    UID: any | null;
    EntityId: Number | undefined;
}

// New models for Client Compliance Tracker based on API response
export interface UserAssignedEntity {
    id: number;
    entityName: string;
}

export interface PendingComplianceTracker {
    id: number;
    complianceId: number | null;
    regulationSetupId: number;
    entityId: number;
    tocRuleType: string | null;
    frequency: string;
    dueDate: string;
    dueAmount: number;
    amountPaid: number;
    actualDate: string;
    payableAmount: number;
    reason: string | null;
    createdOn: string;
    createdBy: number;
    managerId: number | null;
    modifiedOn: string | null;
    modifiedBy: number | null;
    uid: string | null;
    financialYear: string;
    forTheMonth: string;
    cmpId: string;
    tocId: number;
    isRegistration: boolean;
    documentCount: number;
    status: number;
    approvalStatus: string;
    regulationName: string;
    complianceName: string | null;
    managerName: string | null;
    userName: string | null;
    locationId: number;
    complianceTrackerDocumentId: string | null;
    pendingDueDateStatus: string | null;
}

export interface LocationMaster {
    Id: number;
    EntityId: number;
    BUName: string;
    IsParent: boolean;
    LocationCode: number;
    LocationName: string;
    Status: string;
    ParentValue: string;
    Level: number;
    ResponsiblePerson: string;
    Country: string;
    State: string;
    Address: string;
    CreatedBy: string;
}

export interface LocationMasterResponse {
    success: boolean;
    data: string; // JSON string of LocationMaster[]
}

// Model for Compliance Tracker Documents API response
export interface ComplianceTrackerDocument {
    compId: string;
    fileName: string;
    fileContent: string; // Base64 encoded file content
    createdBy: number;
    createdByName: string;
    isDelete: boolean;
    createdDate: string;
}

// Model for Type of Compliance (TOC) from Regulation List API
export interface TypeOfCompliance {
    id: number;
    typeOfComplianceName: string;
    ruleType: string;
    typeOfComplianceUID: string;
    typeOfComplianceId: number | null;
    isPassed: boolean | null;
    frequency: string;
    parameters: RegulationParameter[];
    parentRegulationId: number | null;
    parentRegulationName: string | null;
    parentComplianceId: number | null;
    parentComplianceName: string | null;
    lastModified: string | null;
    forTheMonth: string | null;
    dueDate: string | null;
    complianceTrackerDocumentId: string | null;
}

// Model for Regulation Parameter
export interface RegulationParameter {
    id: number;
    parameterTypeId: number;
    parameterName: string;
    parameterType: string;
    parameterTypeValue: string;
    parameterOperator: string;
    uid: string | null;
    regulationid: number | null;
    userValue: string | null;
    complianceId: number | null;
}

// Model for Regulation from GetRegulationListByEntityId API
export interface RegulationWithTOC {
    id: number;
    entityId: number | null;
    regulationName: string;
    ruleType: string;
    regulationSetupUID: string;
    isPassed: boolean | null;
    createdBy: string | null;
    compliance: any[];
    toc: TypeOfCompliance[];
    parameters: RegulationParameter[];
    isParameterChecked: boolean | null;
}