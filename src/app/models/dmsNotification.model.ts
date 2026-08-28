// Models for api/DmsNotification (upload/share notification feed) and
// api/DmsAccess (DMS folder/file access grants). See ComplianceAPI spec.

export type DmsNotificationType = 'Upload' | 'Share';

export type DmsSourceModule =
  | 'Regulation'     // Upload
  | 'Announcement'   // Upload
  | 'Organization'   // Upload
  | 'DMSFile'        // Share
  | 'DMSFolder';     // Share

export type DmsItemType = 'Folder' | 'File';

export interface DmsNotificationResponse {
  id: number;
  notificationType: DmsNotificationType;
  sourceModule: DmsSourceModule;
  /** id of the uploaded file row (Upload) / folder|file id (Share) */
  sourceRecordId: number;
  /** organization id for Organization uploads, else null */
  entityId: number | null;
  fileName: string | null;
  /** storage-relative path */
  filePath: string | null;
  /** human breadcrumb, e.g. "Organization -> Acme Corp" */
  path: string | null;
  actionByUserId: number;
  actionByName: string | null;
  /** populated only for Share */
  canView: boolean | null;
  canEdit: boolean | null;
  canDelete: boolean | null;
  isRead: boolean;
  readOn: string | null; // ISO datetime
  createdOn: string; // ISO datetime
}

export interface DmsNotificationSummary {
  totalCount: number;
  unreadCount: number;
  notifications: DmsNotificationResponse[];
}

export interface GrantFileFolderAccessRequest {
  itemType: DmsItemType;
  itemId: number;
  dmsUserId: number;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** core Users.Id of the admin doing the grant */
  grantedBy: number | null;
}

export interface RevokeFileFolderAccessRequest {
  itemType: DmsItemType;
  itemId: number;
  dmsUserId: number;
}

export interface FileFolderAccessModel {
  id: number;
  itemType: DmsItemType;
  itemId: number;
  dmsUserId: number;
  dmsUserName: string | null;
  dmsUserEmail: string | null;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  grantedBy: number | null;
  createdOn: string | null;
}

export interface Result<T> {
  success: boolean;
  message: string;
  data: T;
}
