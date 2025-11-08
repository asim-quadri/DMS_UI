import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { Injectable } from "@angular/core";
import { BaseResult, LevelMaster, ServiceRequest, ServiceRequestSortBy } from "../Product_Owner/client/service-request/ServiceRequest";
import { SortDirection } from "ag-grid-community";
import { Observable } from 'rxjs';


@Injectable(
    {
    providedIn: 'root'
    })

export class ServiceRequestService {

  private BASEURL: any = '';
  private ApiBaseLink='/ServiceRequest/'
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

  getImageAuthHeadersJSON() {
    return { headers: undefined };
  }

  getHeadersJSON() {
    return { headers: { 'Content-Type': 'application/json' } }
  }

getAllServiceRequests(sortby: ServiceRequestSortBy) {
  const params = {
    sortby: sortby as ServiceRequestSortBy
  };
  return this.http.get<ServiceRequest[]>(this.BASEURL + 'GetServiceRequestsAsync', {
    ...this.getAuthHeadersJSON(),
    params
  });
}

getServiceRequestByEntityId(entityId: number) {
  return this.http.get<ServiceRequest>(this.BASEURL + 'GetServiceRequestsByEntityAsync?entityId=' + entityId, this.getAuthHeadersJSON());
}

setExpectedDateAsync(serviceRequest: ServiceRequest) {

  return this.http.post<BaseResult>(this.BASEURL + 'SetExpectedDateAndLevelTypeAsync', serviceRequest, this.getAuthHeadersJSON());
}

getAllLevel() {
  return this.http.get<LevelMaster[]>(this.BASEURL + 'GetAllLevel', this.getAuthHeadersJSON());
}

getSortedData(sortBy: number): Observable<ServiceRequest[]> {
  return this.http.get<ServiceRequest[]>( this.BASEURL + `GetServiceRequestsAsync`, {
    params: { sortBy: sortBy.toString() }
  });
}


}