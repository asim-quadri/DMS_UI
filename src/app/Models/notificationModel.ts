import { ModuleType, RefApprovalStatus } from "../enums/enums";


export interface AppNotification {
    notificationId?: string;
    notificationTitle?: string;
    notificationMessage?: string;
    senderUserId: number;
    senderUserName?: string;
    recipientUserId: number;
    recipientUserName?: string;
    moduleType: ModuleType;
    createdDate: Date;
    readDate?: Date;
    status: RefApprovalStatus;
    markAsRead:boolean;
}
export interface NotificationResponse {
  totalCount: number;
  unreadCount: number;
  notifications: AppNotification[];
}

export class TextConstants {
    static readonly ADDED = 'Added';
}
