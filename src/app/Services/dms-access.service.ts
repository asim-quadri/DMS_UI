import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';
import {
  DmsItemType,
  FileFolderAccessModel,
  GrantFileFolderAccessRequest,
  RevokeFileFolderAccessRequest,
  Result
} from '../Models/dmsNotification.model';

@Injectable({
  providedIn: 'root'
})
export class DmsAccessService {
  private readonly base: string;

  constructor(private http: HttpClient, private config: AppConfig) {
    this.base = `${this.config.ServiceUrl}/DmsAccess`;
  }

  private getAuthHeadersJSON() {
    const currentU: any = localStorage.getItem('currentUser');
    const currentUser = JSON.parse(currentU);
    if (currentUser && currentUser.access_token) {
      return { headers: { 'Authorization': 'Bearer ' + currentUser.access_token, 'Content-Type': 'application/json' } };
    }
    return { headers: { 'Authorization': 'Bearer ', 'Content-Type': 'application/json' } };
  }

  grantAccess(payload: GrantFileFolderAccessRequest): Observable<Result<FileFolderAccessModel>> {
    return this.http.post<Result<FileFolderAccessModel>>(`${this.base}/GrantAccess`, payload, this.getAuthHeadersJSON());
  }

  revokeAccess(payload: RevokeFileFolderAccessRequest): Observable<Result<boolean>> {
    return this.http.post<Result<boolean>>(`${this.base}/RevokeAccess`, payload, this.getAuthHeadersJSON());
  }

  getAccessList(itemType: DmsItemType, itemId: number): Observable<FileFolderAccessModel[]> {
    return this.http.get<FileFolderAccessModel[]>(`${this.base}/GetAccessList?itemType=${itemType}&itemId=${itemId}`, this.getAuthHeadersJSON());
  }

  getAccessListForDmsUser(dmsUserId: number): Observable<FileFolderAccessModel[]> {
    return this.http.get<FileFolderAccessModel[]>(`${this.base}/GetAccessListForDmsUser?dmsUserId=${dmsUserId}`, this.getAuthHeadersJSON());
  }
}
