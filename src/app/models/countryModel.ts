import { ResponseModel } from "./responseModel";

export interface CountryModel extends ResponseModel{
    id: number;
    countryName: string;
    countryCode: string;
    countryCodeNumber: number;
    financialStartDate?: any;
    financialEndDate?: any;
    status?: any;
    createdOn?: any;
    createdBy?: any;
    modifiedOn?: any;
    modifiedBy?: any;
    uid: string | null;
    managerId: any | null;
    ApprovalUID:string | null;
  }


  export interface StatesModel extends ResponseModel{
    id: number;
    countryId:number | null;
    stateCode: string | null;
    stateName: string ;
    status: number | null;
    createdOn: string | null;
    createdBy: number | null;
    modifiedOn: string | null;
    modifiedBy: number | null;
    uid: string | null;
    managerId: any | null;
}

export interface CountryStateMapping extends ResponseModel {
  id: number | null;
  countryId: number | null;
  stateId: number | null;
  status: number | null;
  uID: string | null;
  countryName: string | null;
  stateName: string | null;
  countryCode: string | null;
  stateCode: string | null;
  createdOn: string | null;
  createdBy: number | null;
  modifiedOn: string | null;
  modifiedBy: number | null;
  managerId: any | null;
  hide:boolean | false;
}

export interface CountryStateApproval {
  id?: number | null;
  countryId?: number | null;
  countryName?: string | null;
  countryCode?: string | null;
  financialStartDate?: string | null;
  financialEndDate?: string | null;
  financialYear?:string | null;
  countryCodeNumber?: number;
  stateName?: string | null;
  stateCode?: string | null;
  stateId?: number | null;
  fullName?: string | null;
  statusId?: number | null;
  status?: string | null;
  type?:string | null;
  uid?:string | null;
  forward?:string | null;
  countryUID?:string | null;
}
