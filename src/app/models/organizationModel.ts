import { ResponseModel } from "./responseModel";

export interface OrganizationCountryModel {
  id: number;
  countryName: string;
}

export interface OrganizationModel extends ResponseModel {
  id?: number;
  organizationName: string;
  countryId: string;
  country:string;
  state:string;
  countryDDId: number | string;
  stateId: number | string;
  city: string;
  address: string;
  pin: string;
  createdOn?: Date | string;
  createdBy?: number;
  modifiedOn?: Date | string;
  modifiedBy?: number;
}


  export interface OrganizationHistory {
    historyId: number;
    id: number |null;
    organizationName: string |null;
    organizationId: number | null;
    organizationCode: string;
    countryId: number[];
    countryDDId: number;
    stateId: number;
    city: string;
    majorIndustryName: string | null;
    majorIndustryCode: string | null;
    entityType?: string | null;
    entityTypeCode?: string | null;
    countryEntityTypeMappingId?: number;
    address: string;
    pin: string;
    typeOfProduct?: string;
    billingLevel: string;
    numberOfEntities: number;
    numberOfUsers: number;
    managerId: number | null;
    status: number | null;
    createdOn: string | null;
    createdBy: number | null;
    modifiedOn: string | null;
    modifiedBy: number | null;
    uid: string | null;
    primaryEntity?: string;
}

export interface OrganizationApproval {
  id?: number | null;
  organizationId?: number | null;
  organizationName?: string | null;
  managerId?: number | null;
  approvalStatus?: string | null;
  createdOn: string | null;
  createdBy: number | null;
  modifiedOn: string | null;
  modifiedBy: number | null;
  uid?:string | null;
  forward?:string | null;
 }

 export interface OrganizationApprovalList {
  organizationId?: number | null;
  fullName?: string | null;
  statusId?: number | null;
  status: string | null;
  createdBy: string | null;
  createdId: number | null;
  type?: string | null;
  uid?:string | null;
  approvedBy?:string | null;
 }

 export interface OrganizationDetail {
  id?: number;
  organizationName: string;
  organizationCode?: string;
  entity?: string;
  applicationOnboardingCountries?: any;
  countryId: string;
  countryDDId: number | string;
  stateId: number | string;
  stateName: number | string;
  city: string;
  address: string;
  pin: string;
  typeOfProduct?: string;
  numberOfEntities: number | string;
  numberOfUsers: number | string;
  status?: any;
  createdOn?: Date | string;
  createdBy?: number;
  modifiedOn?: Date | string;
  modifiedBy?: number;
  uid?: string | null;
  managerId?: number | null;
  approvalUID?: string | null;
  entityTypeId?: number;
  entityType?: string;
  majorIndustryId?: number;
  majorIndustry?: string;
  minorIndustryId?: number;
  minorIndustry?: string;
  billingLevelId?: number;
  billingLevel?: string;
  primaryEntity?: string;
  isEntity?: boolean;
  isBilling?: boolean;
}

export class OrganizationEntityList {
  id?: number;
  organizationName?: string;
  isOrganization?: boolean;
  entityList: EntityList[] = [];

}

export class EntityList {
  entityId?: number;
  entityName?: string;
}
