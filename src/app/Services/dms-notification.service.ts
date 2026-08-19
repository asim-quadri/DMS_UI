import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';
import { DmsNotificationResponse, SaveResult } from '../Models/dmsNotification.model';

@Injectable({ providedIn: 'root' })
export class DmsNotificationService {
  private readonly base: string;

  constructor(private http: HttpClient, private config: AppConfig) {
    this.base = `${this.config.ServiceUrl}/DmsNotification`;
  }

  private getAuthHeadersJSON() {
    const currentU: any = localStorage.getItem('currentUser');
    const currentUser = JSON.parse(currentU);
    if (currentUser && currentUser.access_token) {
      return {
        headers: {
          Authorization: 'Bearer ' + currentUser.access_token,
          'Content-Type': 'application/json',
        },
      };
    }
    return {
      headers: { Authorization: 'Bearer ', 'Content-Type': 'application/json' },
    };
  }

  /** GET /api/DmsNotification/list?userId={id}&unreadOnly={bool}&userType={optional} */
  list(userId: number, unreadOnly = false, userType: 'User' | 'DmsUser' = 'User'): Observable<DmsNotificationResponse[]> {
    return this.http.get<DmsNotificationResponse[]>(
      `${this.base}/list?userId=${userId}&unreadOnly=${unreadOnly}&userType=${userType}`,
      this.getAuthHeadersJSON()
    );
  }

  /** GET /api/DmsNotification/unread-count?userId={id}&userType={optional} */
  unreadCount(userId: number, userType: 'User' | 'DmsUser' = 'User'): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(
      `${this.base}/unread-count?userId=${userId}&userType=${userType}`,
      this.getAuthHeadersJSON()
    );
  }

  /** PUT /api/DmsNotification/mark-read?notificationId={id}&userId={id}&userType={optional} */
  markRead(notificationId: number, userId: number, userType: 'User' | 'DmsUser' = 'User'): Observable<SaveResult<boolean>> {
    return this.http.put<SaveResult<boolean>>(
      `${this.base}/mark-read?notificationId=${notificationId}&userId=${userId}&userType=${userType}`,
      null,
      this.getAuthHeadersJSON()
    );
  }

  /** PUT /api/DmsNotification/mark-all-read?userId={id}&userType={optional} */
  markAllRead(userId: number, userType: 'User' | 'DmsUser' = 'User'): Observable<SaveResult<number>> {
    return this.http.put<SaveResult<number>>(
      `${this.base}/mark-all-read?userId=${userId}&userType=${userType}`,
      null,
      this.getAuthHeadersJSON()
    );
  }
}
