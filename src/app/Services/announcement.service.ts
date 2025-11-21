import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { Injectable } from "@angular/core";
import { BaseResult, LevelMaster, ServiceRequest, ServiceRequestSortBy } from "../Product_Owner/client/service-request/ServiceRequest";
import { SortDirection } from "ag-grid-community";
import { Observable } from 'rxjs';
import { AnnoucementModel } from "../Models/annoucementModel";
import { accessModel, pendingApproval } from "../Models/pendingapproval";


@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {

  private BASEURL: any = '';
  friends: Array<any> = [];
  public headers: Array<any> = [];

  constructor(public http: HttpClient, private config: AppConfig) { 

    this.BASEURL = this.config.ServiceUrl;
    this.http = http;
    this.headers = [];
    this.headers.push('Content-Type', 'application/json');
    var currnetu: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currnetu);

    if (currentUser && currentUser.access_token) {
      this.headers.push('Authorization', 'Bearer ' + currentUser.token);
    }
  }

      getAuthHeaders() {
    var currnetu: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currnetu);
    if (currentUser && currentUser.access_token) {
      return { headers: { 'Authorization': 'Bearer ' + currentUser.access_token } };

    }
    return { headers: { 'Authorization': 'Bearer ' } };
  }


  getAuthHeadersJSON() {
    var currnetu: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currnetu);
    if (currentUser && currentUser.access_token) {

      return { headers: { 'Authorization': 'Bearer ' + currentUser.access_token, 'Content-Type': 'application/json' } };

    }
    return { headers: { 'Authorization': 'Bearer ', 'Content-Type': 'application/json' } };
  }

  getHeadersJSON() {
    return { headers: { 'Content-Type': 'application/json' } }
  }

  getHistoryAnnouncementByID(uid: any) {
    return this.http.get<AnnoucementModel>(this.BASEURL + '/Announcement/GetHistoryAnnouncement/' + uid, this.getAuthHeadersJSON());
  }

  GetPendingAnnouncementApproval(uid: any) {
    return this.http.get<Array<pendingApproval>>(this.BASEURL + '/Announcement/GetPendingAnnouncementApproval/' + uid, this.getAuthHeadersJSON());
  }

  getAnouncementDetailsById(id: any) {
    return this.http.get<any>(this.BASEURL + '/Announcement/GetAnnouncementDetails?Id=' + id, this.getAuthHeadersJSON());
  }

  addRegulationSetupDetails(announcementDetails: any) {
    return this.http.post<any>(this.BASEURL + '/Announcement/AddAnnouncementDetails', announcementDetails, this.getAuthHeadersJSON())
  }

    submitReject(access: accessModel) {
  
      return this.http.post<any>(this.BASEURL + '/Announcement/RejectAnnouncement', access, this.getAuthHeadersJSON())
    }
  
    submitReviewed(access: accessModel) {
  
      return this.http.post<any>(this.BASEURL + '/Announcement/ApproveAnnouncement', access, this.getAuthHeadersJSON())
    }
  
    submitApproved(access: accessModel) {
  
      return this.http.post<any>(this.BASEURL + '/Announcement/ApproveAnnouncement', access, this.getAuthHeadersJSON())
    }

    getAllAnnouncements(id: any, ruleType?: string): Observable<AnnoucementModel[]> {
      let url = this.BASEURL + '/Announcement/GetAllAnnouncement?id=' + id;
      if (ruleType) {
        url += '&ruleType=' + encodeURIComponent(ruleType);
      }
      return this.http.get<AnnoucementModel[]>(url, this.getAuthHeadersJSON());
    }

    getNextAnnouncementReferenceCode(): Observable<any> {
      return this.http.get<any>(this.BASEURL + '/Announcement/GetNextAnnouncementsReferenceCode', this.getAuthHeadersJSON());
    }
}
