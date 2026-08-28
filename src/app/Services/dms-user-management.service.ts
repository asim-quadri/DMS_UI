import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';
import {
  PostDmsUser, DmsUser,
  PostDmsRole, DmsRoles, ApprovalActions, ApprovalModel
} from '../Models/dms.models';

@Injectable({ providedIn: 'root' })
export class DmsUserManagementService {
  private readonly base: string;

  constructor(private http: HttpClient, private config: AppConfig) {
    this.base = `${this.config.ServiceUrl}/DmsUserManagement`;
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

  // DMS Users
  addDmsUser(payload: PostDmsUser): Observable<DmsUser> {
    return this.http.post<DmsUser>(`${this.base}/AddDmsUser`, payload, this.getAuthHeadersJSON());
  }

  updateDmsUser(payload: PostDmsUser): Observable<DmsUser> {
    return this.http.put<DmsUser>(`${this.base}/UpdateDmsUser`, payload, this.getAuthHeadersJSON());
  }

  /** GET /api/DmsUserManagement/GetAllDmsUsers?userId={id}&includeInactive={bool} */
  getAllDmsUsers(userId: number, includeInactive = false): Observable<DmsUser[]> {
    return this.http.get<DmsUser[]>(`${this.base}/GetAllDmsUsers?userId=${userId}&includeInactive=${includeInactive}`, this.getAuthHeadersJSON());
  }

  getDmsUserByUID(uid: string): Observable<DmsUser> {
    return this.http.get<DmsUser>(`${this.base}/GetDmsUserByUID/${uid}`, this.getAuthHeadersJSON());
  }

  deleteDmsUser(uid: string, status = 0): Observable<DmsUser> {
    return this.http.delete<DmsUser>(`${this.base}/DeleteDmsUser/${uid}?status=${status}`, this.getAuthHeadersJSON());
  }

  // DMS Roles
  addDmsRole(payload: PostDmsRole): Observable<DmsRoles> {
    return this.http.post<DmsRoles>(`${this.base}/AddDmsRole`, payload, this.getAuthHeadersJSON());
  }

  updateDmsRole(payload: PostDmsRole): Observable<DmsRoles> {
    return this.http.put<DmsRoles>(`${this.base}/UpdateDmsRole`, payload, this.getAuthHeadersJSON());
  }

  getAllDmsRoles(): Observable<DmsRoles[]> {
    return this.http.get<DmsRoles[]>(`${this.base}/GetAllDmsRoles`, this.getAuthHeadersJSON());
  }

  getDmsRoleByUID(uid: string): Observable<DmsRoles> {
    return this.http.get<DmsRoles>(`${this.base}/GetDmsRoleByUID/${uid}`, this.getAuthHeadersJSON());
  }

  // DMS User approvals
  getDmsUserApprovals(userUID: string): Observable<{ success: boolean; data: ApprovalModel[] }> {
    return this.http.get<{ success: boolean; data: ApprovalModel[] }>(`${this.base}/GetDmsUserApprovals/${userUID}`, this.getAuthHeadersJSON());
  }

  submitDmsUserApproved(payload: ApprovalActions) {
    return this.http.post<{ success: boolean }>(`${this.base}/SubmitDmsUserApproved`, payload, this.getAuthHeadersJSON());
  }

  submitDmsUserRejected(payload: ApprovalActions) {
    return this.http.post<{ success: boolean }>(`${this.base}/SubmitDmsUserRejected`, payload, this.getAuthHeadersJSON());
  }

  submitDmsUserReviewed(payload: ApprovalActions) {
    return this.http.post<{ success: boolean }>(`${this.base}/SubmitDmsUserReviewed`, payload, this.getAuthHeadersJSON());
  }

  // DMS Role approvals
  getDmsRoleApprovals(userUID: string): Observable<{ success: boolean; data: ApprovalModel[] }> {
    return this.http.get<{ success: boolean; data: ApprovalModel[] }>(`${this.base}/GetDmsRoleApprovals/${userUID}`, this.getAuthHeadersJSON());
  }

  submitDmsRoleApproved(payload: ApprovalActions) {
    return this.http.post<{ success: boolean }>(`${this.base}/SubmitDmsRoleApproved`, payload, this.getAuthHeadersJSON());
  }

  submitDmsRoleRejected(payload: ApprovalActions) {
    return this.http.post<{ success: boolean }>(`${this.base}/SubmitDmsRoleRejected`, payload, this.getAuthHeadersJSON());
  }

  submitDmsRoleReviewed(payload: ApprovalActions) {
    return this.http.post<{ success: boolean }>(`${this.base}/SubmitDmsRoleReviewed`, payload, this.getAuthHeadersJSON());
  }
}
