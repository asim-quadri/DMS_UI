// Models for api/DmsNotification — upload notifications (Compliance Tracker,
// Notices, Opinions, Audits) and DMS sharing notifications (GrantAccess).

export type DmsNotificationType = 'Upload' | 'Share';

export type DmsNotificationSourceModule =
  | 'ComplianceTracker'
  | 'Notices'
  | 'Opinions'
  | 'Audits'
  | 'DMSFile'
  | 'DMSFolder';

export interface DmsNotificationResponse {
  id: number;
  notificationType: DmsNotificationType;
  sourceModule: DmsNotificationSourceModule;
  sourceRecordId: number;
  entityId: number | null;
  fileName: string | null;
  filePath: string | null;
  /** Breadcrumb, e.g. "Regulatory Compliance -> Compliance Tracker -> 2023-2024 -> Regulation_15" */
  path: string | null;
  /** Uploader, or the person who shared (for Share type). */
  actionByUserId: number;
  actionByName: string | null;
  /** Share only. */
  canView: boolean | null;
  canEdit: boolean | null;
  canDelete: boolean | null;
  isRead: boolean;
  readOn: string | null; // ISO datetime
  createdOn: string; // ISO datetime
}

export interface SaveResult<T> {
  success: boolean;
  data: T;
  message: string;
}
