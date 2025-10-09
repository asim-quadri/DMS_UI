import { ResponseModel } from "./responseModel";

export interface ProductTypeModel extends ResponseModel{
    id: number;
    uid: string;
    typeOfProduct?: string;
    createdBy: number;
    createdOn: string;
    modifiedBy?: number | null;
    modifiedOn?: string | null;
    isActive: boolean;
}