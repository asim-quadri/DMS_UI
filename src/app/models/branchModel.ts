import { ResponseModel } from "./responseModel";

export interface BranchModel extends ResponseModel {
    id: number;
    countryId:number | null;
    majorIndustryId: string | null;
    minorIndustryId: string | null;
    tobName: string | null;
    status: number | null;
    createdOn: string | null;
    createdBy: number | null;
    modifiedOn: string | null;
    modifiedBy: number | null;
    uid: string | null;
    managerId: any | null;
    ApprovalUID:string | null;
    approvalManagerId?: number;
    tOBReferenceCode?: string | null;
}
export interface BranchList extends ResponseModel{
    id?: number | null;
    TOBName?: string;
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
export interface TOBApproval {
    id: number | null;
    countryId: number | null;
    countryName: string | null;
    majorIndustryName: string | null;
    majorIndustryCode: string | null;
    majorIndustryId: number | null;
    minorIndustryName: string | null;
    minorIndustryCode: string | null;
    minorIndustryId: number | null;
    TOBName: string | null;
    statusId: number | null;
    status: string | null;
    type:string | null;
    uid:string | null;
}
export interface TOBMapping extends ResponseModel{
    id?: number | null;
    tobId: number | null;
    tobName: string | null;
    countryId: number | null;
    countryName: string | null;
    countryCode: string | null;
    majorIndustryName: string | null;
    majorIndustryCode: string | null;
    majorIndustryId: number | null;
    minorIndustryName: string | null;
    minorIndustryCode: string | null;
    minorIndustryId: number | null;
    createdOn: string | null;
    createdBy: number | null;
    modifiedOn: string | null;
    modifiedBy: number | null;
    managerId: any | null;
    hide:boolean | false;
  }
