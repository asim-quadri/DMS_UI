import { ResponseModel } from "./responseModel";

export interface BillingFrequencyModel extends ResponseModel{
    id: number;
    uuid: string;
    frequency: string;
    createdBy: number;
    createdOn: string;
    modifiedBy?: number | null;
    modifiedOn?: string | null;
    isActive: boolean;
}