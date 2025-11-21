import { ResponseModel } from "./responseModel";

export interface BillingDetailsModel extends ResponseModel {
  id?: number;
  organizationId: number;
  entityId?: number;
  pAN: string;
  tAN: string;
  gSTNo: string;
  address: string;
  city: string;
  countryId?: number | null;
  stateId?: number | null;
  pIN: string;
  orderId: string;
  serviceProvider?: number | null;
  feePerEntity?: number | null;
  feePerUser?: number | null;
  billNumber: string;
  billingFrequency?: number | null;
  billDate?: Date | string;
  remarks: string;
  CollectionDate?: Date | null;
  billAmount?: number | null;
  tDS?: number | null;
  receivedAmount?: number | null;
  checkNumber: string;
  billStatus?: number | null;
  deliveryStatus?: number | null;
  createdBy?: number | null;
  totalFee?: number | null;
  paymentTerm: string;
  dueDate?: Date | null;
}

export interface BillingDetialsHistory {
  historyId?: number;
  id?: number;
  ProductType: number;
  BillingLevel: number;
  Countries: string;
  Address: string;
  City: string;
  CountryId?: number | null;
  StateId?: number | null;
  PAN: string;
  TAN: string;
  GSTNo: string;
  BillingAddress: string;
  BillingCity: string;
  BillingCountryId?: number | null;
  BillingStateId?: number | null;
  OrderId: string;
  ServiceProvider?: number | null;
  FeePerEntity?: number | null;
  FeePerUser?: number | null;
  BillNumber: string;
  BillingFrequency?: number | null;
  BillingDate?: Date | string;
  CollectionBillNumber: string;
  CollectionBillAmount?: number | null;
  ReceivedAmount?: number | null;
  TDS?: number | null;
  CollectionDate?: Date | null;
  CheckNumber: string;
  BillStatus?: number | null;
  totalFee?: number | null;
  paymentTerm: string;
  dueDate?: Date | null;
}

export interface BillingDetailsApproval {
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

export interface BillingDetailsApprovalList {
  organizationId?: number | null;
  entityId?: number | null;
  type: string | null;
  name?: string | null;
  customerId?: string | null;
  pointOfContact: string | null;
  approvedby: string | null;
  onboardingStage: string | null;
  status: string | null;
}

export interface BillingDetailsView {
  id?: number;
  organizationId: number;
  entityId?: number;
  pAN: string;
  tAN: string;
  gSTNo: string;
  address: string;
  city: string;
  countryId?: number | null;
  stateId?: number | null;
  pIN: string;
  orderId: string;
  serviceProvider?: number | null;
  feePerEntity?: number | null;
  feePerUser?: number | null;
  billNumber: string;
  billingFrequency?: number | null;
  billDate?: Date | string;
  remarks: string;
  CollectionDate?: Date | null;
  billAmount?: number | null;
  tDS?: number | null;
  receivedAmount?: number | null;
  checkNumber: string;
  billStatus?: number | null;
  deliveryStatus?: number | null;
  createdBy?: number | null;
  organizationName: string;
  entityName: string;
  countryName: string;
  stateName: string;
  serviceProviderName: string;
  frequency: string;
  billDateString: string;
  collectionDateString: string;
  billStatusName: string;
  deliveryStatusName: string;
  typeOfProduct: string;
  billingLevelName: string;
  totalFee?: number | null;
  paymentTerm: string;
  dueDate?: Date | null;
}

export interface BillingDetailsByEntity {
  organizationId: number;
  organizationName: string;
  entityId: number;
  entityName: string;
  billNumber: string;
  billDate: string;
  receivedAmount: number;
  billStatus: number;
  billStatusName: string;
  dueDate: string;
  createdById: number;
  createdByName: string;
  roleId: number;
  roleName: string;
  colorCode: string;
}