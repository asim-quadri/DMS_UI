export interface pendingApproval {
  id?: number
  historyId?: number
  fullName?: string
  empId?: string
  roleName?: string
  roleDisplayName?: string
  approvalType?: string
  approvalTypeId?: number
  status?: string
  pointofContact?: string
  approverUID?: string
  approvalStatus?: any
  userUID?: string
  roleUID?: string
  productMappingId?: number
  approverManager?: number
  review?: boolean
  productID?: number
  createdBy?: number
  displayName?: string
}

export interface accessModel {
  id?: number
  userId?: number
  historyId?: number
  productId?: number
  status?: number | string
  enable?: number
  createdBy?: number
  uid?: string
  managerId?: number
  approvalType?: string
  ApprovalTypeId?: number
  productMappingId?: number,
  productName?: string
  userUID?: string
  countryId?: number
  stateId?: number
  countryStateMappingId?: number
  majorIndustryId?: number
  minorIndustryId?: number
  countryMajorIndustryMappingId?: number
  MajorMinorIndustryMappingId?: number
  regulationGroupId?: number
  countryRegulationGroupMappingId?: number
  countryEntityTypeMappingId?: number
  entityTypeId?: number
  IndustryMappingId?: number
  entityId?: number;
  billingDetailId?: number;
  TOBId?: number;
  TOBMappingId?: number;
  tobHistoryId?:number;
}

