import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { NotificationResponse } from '../Models/notificationModel';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private BASEURL: any = '';
  private ApiBaseLink='/Notification/'
  public error: any;
  public headers: Array<any> = [];

  constructor(public http: HttpClient, private config: AppConfig) {
  
      this.BASEURL = `${this.config.ServiceUrl}${this.ApiBaseLink}`;
      this.http = http;
      this.headers = [];
      this.headers.push('Content-Type', 'application/json');
      var currnetu: any = localStorage.getItem('currentUser');
      let currentUser = JSON.parse(currnetu);
  
      if (currentUser && currentUser.access_token) {
        this.headers.push('Authorization', 'Bearer ' + currentUser.token);
      }
    }

  getApprovalNotifications(userId: string): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.BASEURL}GetAllApprovalNotifications?userId=${userId}`);
  }

  markNotificationAsRead(userUID: string, notificationId: string, markAsRead: boolean = true) {
  const url = `${this.BASEURL}MarkNotificationAsRead` +
              `?UserUID=${userUID}&notificationId=${notificationId}&markAsRead=${markAsRead}`;

  return this.http.put(url, {}); 
}


}
