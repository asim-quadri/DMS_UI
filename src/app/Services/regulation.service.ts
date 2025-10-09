import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { AppConfig } from '../app.config'
import { RegulationGroupModel } from '../models/regulationGroupModel';
import { forkJoin } from 'rxjs';
import { accessModel } from '../models/pendingapproval';




@Injectable()

export class RegulationGroupService {

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

  postRegulationGroup(country: RegulationGroupModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationGroup/PostRegulationGroup', country, this.getAuthHeadersJSON())
  }

  getAllRegulationGroups() {
    return this.http.get<Array<RegulationGroupModel>>(this.BASEURL + '/RegulationGroup/GetAllRegulationGroups', this.getAuthHeadersJSON());
  }
  getCountryRegulationGroupMapping() {
    return this.http.get<Array<RegulationGroupModel>>(this.BASEURL + '/RegulationGroup/GetCountryRegulationGroupMapping', this.getAuthHeadersJSON());
  }

  postCountryRegulationGroupMapping(country: RegulationGroupModel) {
    return this.http.post<RegulationGroupModel>(this.BASEURL + '/RegulationGroup/PostCountryRegulationGroupMapping', country, this.getAuthHeadersJSON())
  }


  getRegulationGroupApprovalList(UserUID:any) {
    return this.http.get<Array<RegulationGroupModel>>(this.BASEURL + '/RegulationGroup/GetRegulationGroupApprovalList/'+UserUID, this.getAuthHeadersJSON());
  }

  getCountryRegulationGroupMappingApproval(UserUID:any) {
    return this.http.get<Array<RegulationGroupModel>>(this.BASEURL + '/RegulationGroup/GetCountryRegulationGroupMappingApproval/'+UserUID, this.getAuthHeadersJSON());
  }


  submitRegulationGroupApprove(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationGroup/PostRegulationGroupApprove', access, this.getAuthHeadersJSON())
  }

  submitRegulationGroupReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationGroup/PostRegulationGroupReject', access, this.getAuthHeadersJSON())
  }

  submitRegulationGroupForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationGroup/PostRegulationGroupForward', access, this.getAuthHeadersJSON())
  }


  submitCountryRegulationGroupApprove(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationGroup/PostCountryRegulationGroupApprove', access, this.getAuthHeadersJSON())
  }

  submitCountryRegulationGroupReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationGroup/PostCountryRegulationGroupReject', access, this.getAuthHeadersJSON())
  }

  submitCountryRegulationGroupForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationGroup/PostCountryRegulationGroupForward', access, this.getAuthHeadersJSON())
  }

  multipleAPIRequests(request:any){
    return forkJoin(request);
  }
}
