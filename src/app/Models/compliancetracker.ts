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