// Models for the DMS User/Role/Approval module (api/DmsUserManagement).

export interface PostDmsUser {
  Id?: number;
  EmpId?: string;
  FullName?: string;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  Mobile?: string;
  Password?: string;
  StartDate?: string; // ISO date
  EndDate?: string;
  ManagerId?: number;
  /** Set this to raise a Pending approval row when adding/updating. */
  ApprovalManagerId?: number;
  CreatedBy?: number;
  ModifiedBy?: number;
  RoleId?: number;
  Status?: number; // 1 = active
  OrganizationId?: number;
  Designation?: string;
  DateOfBirth?: string;
  Gender?: number;
}

export interface DmsUser {
  ResponseCode?: number;
  ResponseMessage?: string;
  Id?: number;
  EmpId?: string;
  FirstName?: string;
  LastName?: string;
  FullName?: string;
  Email?: string;
  Mobile?: string;
  Password?: string;
  Status?: number;
  StartDate?: string;
  EndDate?: string;
  ManagerId?: number;
  CreatedOn?: string;
  CreatedBy?: number;
  ModifiedOn?: string;
  ModifiedBy?: number;
  UID?: string;
  RoleDisplayName?: string;
  RoleName?: string;
  RoleId?: number;
  OrganizationId?: number;
  Designation?: string;
  DateOfBirth?: string;
  Gender?: number;
}

export interface PostDmsRole {
  Id?: number;
  RoleName?: string;
  RoleDisplayName?: string;
  Description?: string;
  ManagerId?: number;
  /** Set this to raise a Pending approval row when adding/updating. */
  ApprovalManagerId?: number;
  Status?: number;
  CreatedBy?: number;
  ModifiedBy?: number;
  UID?: string;
}

export interface DmsRoles {
  ResponseCode?: number;
  ResponseMessage?: string;
  Id?: number;
  ManagerId?: number;
  RoleName?: string;
  RoleDisplayName?: string;
  Description?: string;
  ManagerName?: string;
  Status?: number;
  CreatedOn?: string;
  CreatedBy?: number;
  ModifiedOn?: string;
  ModifiedBy?: number;
  UID?: string;
}

export interface ApprovalActions {
  ApprovalTableId: number; // the approval row's own Id (DmsUserApproval.Id / DmsRoleApproval.Id)
  ReferenceTableId?: number;
  CreatedBy?: number; // the actor performing this approve/reject/forward action
  ManagerId?: number; // required for Forward - the new approver
  ApprovalActionType?: string; // set by the backend per submit-endpoint; you don't need to set it
  approvalStatusId?: number;
  Status?: boolean; // optional: also flips DmsUser/DmsRole active flag
  ComponentType?: string; // set by the backend ("DmsUser" / "DmsRole"); you don't need to set it
}

export interface ApprovalModel {
  Id?: number;
  ReferenceTableId?: number;
  ManagerId?: number;
  CreatedById?: number;
  ModifiedBy?: number;
  ApprovalStatus?: string; // "Pending" | "Approved" | "Rejected" | "Reviewed"
  ApprovalType?: string; // "DmsUser" | "DmsRole"
  ReferenceTableUIId?: string;
  ApprovalUIId?: string;
  Action?: string; // "Created" | "Updated"
}

// Models for api/DmsAccess (per-file/per-folder access grants to DMS users)

export type DmsItemType = 'Folder' | 'File';

export interface GrantAccessRequest {
  itemType: DmsItemType;
  itemId: number;
  dmsUserId: number;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  grantedBy: number;
}

export interface RevokeAccessRequest {
  itemType: DmsItemType;
  itemId: number;
  dmsUserId: number;
}

export interface DmsAccessListItem {
  id: number;
  itemType: DmsItemType;
  itemId: number;
  dmsUserId: number;
  dmsUserName: string;
  dmsUserEmail: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  grantedBy: number;
  createdOn: string;
}
