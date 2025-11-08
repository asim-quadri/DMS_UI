import { ResponseModel } from "./responseModel";

export interface EntityModel extends ResponseModel {
  id?: number;
  entityName: string;
  entityId?: number | null;
  organizationId: number;
  organizationName: string;
  countryId: number;
  countryName?: string;
  countryDDId: number | string;
  stateId: number | string;
  stateName?: string;
  city: string;
  address: string;
  pin: string;
  status?: any;
  createdOn?: Date | string;
  createdBy?: number;
  modifiedOn?: Date | string;
  modifiedBy?: number;
  uID?: string | null;
  managerId?: number | null;
  approvalUID?: string | null;
  entityTypeId?: number;
  entityType?: string;
  majorIndustryId?: number;
  majorIndustry?: string;
  majorIndustryName: string;
  minorIndustryId?: number;
  minorIndustry?: string;
  minorIndustryName?: string;
  financialYearStart?: number | null;
  financialYearEnd?: number | null;
  fromMonth?: string;
  toMonth?: string;
  hasServiceRequests?:boolean;
  hasBillingDetails?:boolean;
}

export interface EntityHistory {
  historyId?: number;
  id?: number;
  entityName: string;
  isPrimaryEntity?: boolean;
  organizationId: number;
  countryId: number;
  uID?: string | null;
  countryDDId: number | string;
  stateId: number | string;
  city: string;
  address: string;
  pin: string;
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
  financialYearStart?: number | null;
  financialYearEnd?: number | null;
  fromMonth?: string;
  toMonth?: string;
}

export interface EntityApproval {
  id?: number | null;
  entityId?: number | null;
  entityName?: string | null;
  managerId?: number | null;
  approvalStatus?: string | null;
  createdOn: string | null;
  createdBy: number | null;
  modifiedOn: string | null;
  modifiedBy: number | null;
  uid?: string | null;
  forward?: string | null;
}

export interface EntityApprovalList {
  organizationId?: number | null;
  entityId?: number | null;
  billingDetilsId?: number | null;
  type: string | null;
  name?: string | null;
  customerId?: string | null;
  pointOfContact: string | null;
  approvedby: string | null;
  onboardingStage: string | null;
  status: string | null;
}

export interface EntityDetail {
  id?: number;
  entityName: string;
  isPrimaryEntity?: boolean;
  countryId: number;
  countryDDId: number | string;
  stateId: number | string;
  city: string;
  address: string;
  pin: string;
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
}
export interface Years {
  id: number;
  year: number;
}

export interface Months {
  start: string;
  end: string;
}