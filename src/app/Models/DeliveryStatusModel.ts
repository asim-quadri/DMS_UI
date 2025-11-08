import { ResponseModel } from "./responseModel";

export interface DeliveryStatusModel extends ResponseModel{
    id: number;
    uuid: string;
    deliveryStatusName: string;
    createdBy: number;
    createdOn: string;
    modifiedBy?: number | null;
    modifiedOn?: string | null;
    isActive: boolean;
}