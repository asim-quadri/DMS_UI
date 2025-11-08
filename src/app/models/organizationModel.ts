import { ResponseModel } from "./responseModel";

export interface OrganizationCountryModel {
  id: number;
  countryName: string;
}

export interface OrganizationModel extends ResponseModel {
  id?: number;
  organizationName: string;
  organizationCode?: string;
  primaryEntity?: string; // Primary Entity
  entity?: string;
  applicationOnboardingCountries?: any;
  countryId: string;
  countryDDId: number | string;
  stateId: number | string;
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
  fullName?: string;
  emailID?: string;
  designation?: string;
  password?: string;
  financialYearStart?: number | null;
  financialYearEnd?: number | null;
  fromMonth?: string;
  toMonth?: string;
  noofBranches?: number;
  roleId?: number;
  entities?: entitesDataModel[];
}

export interface entitesDataModel {
  id: number,
  entityName: string,
  organizationId: number,
  organizationName: null,
  majorIndustryId: number,
  minorIndustryId: number,
  majorIndustry: string | null,
  minorIndustry: string | null,
  majorIndustryName: string | null,
  minorIndustryName: string | null,
  countryId: number | null,
  countryName: string | null,
  stateId: number | null,
  stateName: string | null,
  city: string | null,
  address: string | null,
  pin: string | null,
  status: number,
  createdOn: string,
  createdBy: number,
  modifiedOn: string,
  modifiedBy: number,
  uid: string,
  managerId: number,
  entityTypeId: number,
  entityType: string,
  customerId: number,
  pointOfContact: string,
  approvedby: number,
  financialYearStart: number,
  financialYearEnd: number,
  toMonth: string,
  fromMonth: string,
  latitude: number,
  longitude: number,
  hasBillingDetails: boolean,
  hasServiceRequests: boolean,
  responseCode: number,
  responseMessage: string,
  resultSet: any
}

export interface OrganizationHistory {
  historyId: number;
  id: number | null;
  organizationName: string | null;
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
  fullName?: string;
  emailID?: string;
  designation?: string;
  password?: string;
  financialYearStart?: number | null;
  financialYearEnd?: number | null;
  fromMonth?: string;
  toMonth?: string;
  noofBranches?: number;
  roleId?: number;
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
  uid?: string | null;
  forward?: string | null;
}

export interface OrganizationApprovalList {
  organizationId?: number | null;
  fullName?: string | null;
  statusId?: number | null;
  status: string | null;
  createdBy: string | null;
  createdId: number | null;
  type?: string | null;
  uid?: string | null;
  approvedBy?: string | null;
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
  fullName?: string;
  emailID?: string;
  designation?: string;
  password?: string;
  financialYearStart?: number | null;
  financialYearEnd?: number | null;
  fromMonth?: string;
  toMonth?: string;
  noofBranches?: number;
  roleId?: number;
}

export class OrganizationEntityList {
  id?: number;
  organizationName?: string;
  isOrganization?: boolean;
  entityList: EntityList[] = [];
  hide?: boolean;

}

export class EntityList {
  entityId?: number;
  entityName?: string;
  hide?: boolean;
}