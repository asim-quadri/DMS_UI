import { ResponseModel } from "./responseModel";

export interface BillingLevelModel extends ResponseModel{
    id: number;
    uuid: string;
    billingLevelName: string;
    createdBy: number;
    createdOn: string;
    modifiedBy?: number | null;
    modifiedOn?: string | null;
    isActive: boolean;
}