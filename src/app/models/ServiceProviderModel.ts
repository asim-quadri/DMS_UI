import { ResponseModel } from "./responseModel";

export interface ServiceProviderModel extends ResponseModel{
    id: number;
    uuid: string;
    serviceProviderName: string;
    createdBy: number;
    createdOn: string;
    modifiedBy?: number | null;
    modifiedOn?: string | null;
    isActive: boolean;
}