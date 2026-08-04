import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';
import { GrantAccessRequest, RevokeAccessRequest, DmsAccessListItem, DmsItemType } from '../Models/dms.models';

@Injectable({ providedIn: 'root' })
export class DmsAccessService {
  private readonly base: string;

  constructor(private http: HttpClient, private config: AppConfig) {
    this.base = `${this.config.ServiceUrl}/DmsAccess`;
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

  grantAccess(payload: GrantAccessRequest): Observable<{ success: boolean; data: DmsAccessListItem; message: string }> {
    return this.http.post<{ success: boolean; data: DmsAccessListItem; message: string }>(
      `${this.base}/GrantAccess`, payload, this.getAuthHeadersJSON()
    );
  }

  revokeAccess(payload: RevokeAccessRequest): Observable<{ success: boolean; data: boolean; message: string }> {
    return this.http.post<{ success: boolean; data: boolean; message: string }>(
      `${this.base}/RevokeAccess`, payload, this.getAuthHeadersJSON()
    );
  }

  getAccessList(itemType: DmsItemType, itemId: number): Observable<DmsAccessListItem[]> {
    return this.http.get<DmsAccessListItem[]>(
      `${this.base}/GetAccessList?itemType=${itemType}&itemId=${itemId}`, this.getAuthHeadersJSON()
    );
  }
}
