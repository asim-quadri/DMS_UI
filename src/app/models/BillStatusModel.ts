import { ResponseModel } from "./responseModel";

export interface BillStatusModel extends ResponseModel{
    id: number;
    uuid: string;
    billStatusName: string;
    createdBy: number;
    createdOn: string;
    modifiedBy?: number | null;
    modifiedOn?: string | null;
    isActive: boolean;
}