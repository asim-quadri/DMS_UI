import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { ParameterModel } from '../models/parameter';
import { accessModel, pendingApproval } from '../models/pendingapproval';

@Injectable({
  providedIn: 'root'
})
export class ParameterService {

  private BASEURL: any = '';
  public error: any;

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

  getImageAuthHeadersJSON() {
    return { headers: undefined };
  }

  getHeadersJSON() {
    return { headers: { 'Content-Type': 'application/json' } }
  }

  getAllParameters() {
    return this.http.get<Array<ParameterModel>>(this.BASEURL + '/ParameterSetup/GetAllParameters', this.getAuthHeadersJSON());
  }

  getParameterById(id: any) {
    return this.http.get<Array<ParameterModel>>(this.BASEURL + '/ParameterSetup/GetParameterById/' + id, this.getAuthHeadersJSON());
  }

  delteParameterByUID(uid: any) {
    return this.http.delete<ParameterModel>(this.BASEURL + '/ParameterSetup/deleteParameters/' + uid + '/0', this.getAuthHeadersJSON());
  }

  addParameter(parameter: ParameterModel, accessUID: any = '') {
    return this.http.post<any>(this.BASEURL + '/ParameterSetup/AddParameter?accessUID=' + accessUID, parameter, this.getAuthHeadersJSON())
  }

  getAllParametersPendingApprovals(userUID: string) {
    return this.http.get<Array<pendingApproval>>(this.BASEURL + '/ParameterSetup/GetAllParametersApproval/' + userUID, this.getAuthHeadersJSON());
  }

  getHistoryParameterByID(uid: any) {
    return this.http.get<ParameterModel>(this.BASEURL + '/ParameterSetup/GetHistoryParameters/' + uid, this.getAuthHeadersJSON());
  }

  submitReject(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/ParameterSetup/PostRejectAccess', access, this.getAuthHeadersJSON())
  }

  submitReviewed(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/ParameterSetup/PostReviewedAccess', access, this.getAuthHeadersJSON())
  }

  submitApproved(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/ParameterSetup/PostApproveAccess', access, this.getAuthHeadersJSON())
  }
}
