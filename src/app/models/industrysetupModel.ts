import { ResponseModel } from "./responseModel";

export interface MajorIndustryModel extends ResponseModel{
    id: number;
    countryId:number | null;
    majorIndustryName: string | null;
    majorIndustryCode: string | null;
    status: number | null;
    createdOn: string | null;
    createdBy: number | null;
    modifiedOn: string | null;
    modifiedBy: number | null;
    uid: string | null;
    managerId: any | null;
    ApprovalUID:string | null;
  }


  export interface MinorIndustrypModel extends ResponseModel{
    id: number;
    majorIndustryId:number | null;
    minorIndustryName: string;
    minorIndustryCode: string;
    status?: any;
    createdOn?: any;
    createdBy?: any;
    modifiedOn?: any;
    modifiedBy?: any;
    uid: string | null;
    managerId: any | null;
    ApprovalUID:string | null;
    minorIndustryReferenceCode?: string | null;
  }

  export interface CountryMajorMapping extends ResponseModel {
    id: number | null;
    countryId: number | null;
    majorIndustryId: number | null;
    status: number | null;
    uID: string | null;
    countryName: string | null;
    countryCode: string | null;
    majorIndustryName: string | null;
    majorIndustryCode: string | null;
    createdOn: string | null;
    createdBy: number | null;
    modifiedOn: string | null;
    modifiedBy: number | null;
    managerId: any | null;
    hide:boolean | false;
  }

  
  export interface CountryMajorApproval {
    id?: number | null;
    countryId?: number | null;
    countryName?: string | null;
    countryCode?: string | null;
    majorIndustryId?: number | null;
    majorIndustryName: string | null;
    majorIndustryCode: string | null;
    statusId?: number | null;
    status?: string | null;
    type?:string | null;
    uid?:string | null;
    majorUID?:string | null;
  }

  export interface MajorMinorMapping extends ResponseModel {
    id: number | null;
    majorIndustryId: number | null;
    minorIndustryId: number | null;
    status: number | null;
    uID: string | null;
    majorIndustryName: string | null;
    minorIndustryName: string | null;
    majorIndustryCode: string | null;
    minorIndustryCode: string | null;
    createdOn: string | null;
    createdBy: number | null;
    modifiedOn: string | null;
    modifiedBy: number | null;
    managerId: any | null;
    hide:boolean | false;
    tobId:string | null;
    tobName:string | null;
  }

  export interface MajorMinorIndustryApproval {
    id: number | null;
    countryId: number | null;
    countryName: string | null;
    countryCode: string | null;
    majorIndustryName: string | null;
    majorIndustryCode: string | null;
    majorIndustryId: number | null;
    minorIndustryName: string | null;
    minorIndustryCode: string | null;
    minorIndustryId: number | null;
    fullName: string | null;
    statusId: number | null;
    status: string | null;
    type:string | null;
    uid:string | null;
    minorUID?:string | null;
  }
  export interface IndustryApproval {
    id?: number | null;
    countryId: number | null;
    countryName: string | null;
    countryCode: string | null;
    majorIndustryName: string | null;
    majorIndustryCode: string | null;
    majorIndustryId: number | null;
    minorIndustryName: string | null;
    minorIndustryCode: string | null;
    minorIndustryId: number | null;
    fullName?: string | null;
    statusId?: number | null;
    status?: string | null;
    type?:string | null;
    uid?:string | null;
    forward?:string | null;
    countryUID?:string | null;
  }
  export interface IndustryMapping extends ResponseModel{
    id?: number | null;
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
    minorIndustryReferenceCode: string | null;
    createdByName: string | null;
    approvedByName: string | null;
      
  }
