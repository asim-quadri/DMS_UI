import { ResponseModel } from "./responseModel";

export interface ParameterModel extends ResponseModel{
    id?: number | null;
    parameterName?: string;
    parameterType?: string;
    numericparameter?: boolean;
    nonnumericparameterType?: boolean;
    status?: number;
    managerId?: number;
    createdOn?: string;
    createdBy?: number;
    modifiedOn?: any;
    modifiedBy?: any;
    uid?: string | null;
    roleDisplayName?: string
    roleName?: string
    roleId?: number
    approvalManagerId?: number
    hide:boolean | false;
}

export interface ParameterList extends ResponseModel{
    id?: number | null;
    parameterName?: string;
    parameterType?: string;
    numericparameter?: boolean;
    nonnumericparameterType?: boolean;
    status?: number;
    managerId?: number;
    createdOn?: string;
    createdBy?: number;
    modifiedOn?: any;
    modifiedBy?: any;
    uid?: string | null;
    roleDisplayName?: string
    roleName?: string
    roleId?: number
    approvalManagerId?: number
}