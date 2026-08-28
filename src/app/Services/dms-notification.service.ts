import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { AppConfig } from '../app.config';
import { PersistenceService } from './persistence.service';
import { DmsNotificationSummary, Result } from '../Models/dmsNotification.model';

@Injectable({
  providedIn: 'root'
})
export class DmsNotificationService {
  private readonly base: string;

  private notificationsSource = new BehaviorSubject<DmsNotificationSummary['notifications']>([]);
  private unreadCountSource = new BehaviorSubject<number>(0);
  notifications$ = this.notificationsSource.asObservable();
  unreadCount$ = this.unreadCountSource.asObservable();

  private pollingStarted = false;

  constructor(private http: HttpClient, private config: AppConfig, private persistence: PersistenceService) {
    this.base = `${this.config.ServiceUrl}/DmsNotification`;
  }

  private getAuthHeadersJSON() {
    const currentU: any = localStorage.getItem('currentUser');
    const currentUser = JSON.parse(currentU);
    if (currentUser && currentUser.access_token) {
      return { headers: { 'Authorization': 'Bearer ' + currentUser.access_token, 'Content-Type': 'application/json' } };
    }
    return { headers: { 'Authorization': 'Bearer ', 'Content-Type': 'application/json' } };
  }

  /**
   * This app's only session is the core Users login (PersistenceService) —
   * there's no separate DmsUser session/auth store to hold a DmsUser id in.
   * Per the API contract, userType:'User' tells the backend to map the core
   * user id to its DmsUser via email, so that's what every call below uses.
   */
  private identity(): { userId: number; userType: string } | null {
    const userId = this.persistence.getUserId();
    if (userId == null) {
      return null;
    }
    return { userId, userType: 'User' };
  }

  // ====== Raw endpoint calls ======

  getNotifications(unreadOnly = false): Observable<DmsNotificationSummary> {
    const id = this.identity();
    if (!id) {
      return of({ totalCount: 0, unreadCount: 0, notifications: [] });
    }
    return this.http.get<DmsNotificationSummary>(
      `${this.base}/GetNotifications?userId=${id.userId}&unreadOnly=${unreadOnly}&userType=${id.userType}`,
      this.getAuthHeadersJSON()
    );
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    const id = this.identity();
    if (!id) {
      return of({ unreadCount: 0 });
    }
    return this.http.get<{ unreadCount: number }>(
      `${this.base}/GetUnreadCount?userId=${id.userId}&userType=${id.userType}`,
      this.getAuthHeadersJSON()
    );
  }

  markAsRead(notificationId: number): Observable<Result<boolean>> {
    const id = this.identity();
    if (!id) {
      return of({ success: false, message: 'Not signed in', data: false });
    }
    return this.http.put<Result<boolean>>(
      `${this.base}/MarkAsRead?notificationId=${notificationId}&userId=${id.userId}&userType=${id.userType}`,
      null,
      this.getAuthHeadersJSON()
    );
  }

  markAllAsRead(): Observable<Result<number>> {
    const id = this.identity();
    if (!id) {
      return of({ success: false, message: 'Not signed in', data: 0 });
    }
    return this.http.put<Result<number>>(
      `${this.base}/MarkAllAsRead?userId=${id.userId}&userType=${id.userType}`,
      null,
      this.getAuthHeadersJSON()
    );
  }

  // ====== Convenience wrappers that also update notifications$/unreadCount$ ======

  /** Fetches the list (and its authoritative unread count) and pushes both into the observables. */
  refreshNotifications(unreadOnly = false): void {
    this.getNotifications(unreadOnly).subscribe({
      next: (summary) => {
        this.notificationsSource.next(summary.notifications || []);
        this.unreadCountSource.next(summary.unreadCount || 0);
      },
      error: (err) => console.error('Failed to load DMS notifications', err)
    });
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (result) => this.unreadCountSource.next(result.unreadCount || 0),
      error: (err) => console.error('Failed to load DMS unread count', err)
    });
  }

  /** Optimistic local update after a single mark-read — avoids a full re-fetch. */
  applyMarkedReadLocally(notificationId: number): void {
    const list = this.notificationsSource.value;
    const row = list.find(n => n.id === notificationId);
    if (!row || row.isRead) {
      return;
    }
    this.notificationsSource.next(list.map(n =>
      n.id === notificationId ? { ...n, isRead: true, readOn: new Date().toISOString() } : n
    ));
    this.unreadCountSource.next(Math.max(0, this.unreadCountSource.value - 1));
  }

  /** Optimistic local update after mark-all — avoids a full re-fetch. */
  applyMarkedAllReadLocally(): void {
    const now = new Date().toISOString();
    this.notificationsSource.next(this.notificationsSource.value.map(n => n.isRead ? n : { ...n, isRead: true, readOn: now }));
    this.unreadCountSource.next(0);
  }

  /** Starts 60s unread-count polling — idempotent, safe to call from every bell instance. */
  startPolling(intervalMs = 60000): void {
    if (this.pollingStarted) {
      return;
    }
    this.pollingStarted = true;
    this.refreshUnreadCount();
    interval(intervalMs).subscribe(() => this.refreshUnreadCount());
  }
}
