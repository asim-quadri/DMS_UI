import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { AppConfig } from '../app.config'

import { forkJoin } from 'rxjs';
import { accessModel } from '../models/pendingapproval';
import { EntityTypeModel } from '../models/entityTypeModel';


@Injectable({
  providedIn: 'root'
})

@Injectable()

export class EntityTypeService{

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

  postEntityType(country: EntityTypeModel) {
    return this.http.post<any>(this.BASEURL + '/EntityType/PostEntityType', country, this.getAuthHeadersJSON())
  }

  getAllEntityTypes() {
    return this.http.get<Array<EntityTypeModel>>(this.BASEURL + '/EntityType/GetAllEntityTypes', this.getAuthHeadersJSON());
  }
  getCountryEntityTypeMapping() {
    return this.http.get<Array<EntityTypeModel>>(this.BASEURL + '/EntityType/GetCountryEntityTypeMapping', this.getAuthHeadersJSON());
  }

  postCountryEntityTypeMapping(country: EntityTypeModel) {
    return this.http.post<EntityTypeModel>(this.BASEURL + '/EntityType/PostCountryEntityTypeMapping', country, this.getAuthHeadersJSON())
  }


  getEntityTypeApprovalList(UserUID:any) {
    return this.http.get<Array<EntityTypeModel>>(this.BASEURL + '/EntityType/GetEntityTypeApprovalList/'+UserUID, this.getAuthHeadersJSON());
  }

  getCountryEntityTypeMappingApproval(UserUID:any) {
    return this.http.get<Array<EntityTypeModel>>(this.BASEURL + '/EntityType/GetCountryEntityTypeMappingApproval/'+UserUID, this.getAuthHeadersJSON());
  }


  submitEntityTypeApprove(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/EntityType/PostEntityTypeApprove', access, this.getAuthHeadersJSON())
  }

  submitEntityTypeReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/EntityType/PostEntityTypeReject', access, this.getAuthHeadersJSON())
  }

  submitEntityTypeForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/EntityType/PostEntityTypeForward', access, this.getAuthHeadersJSON())
  }


  submitCountryEntityTypeApprove(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/EntityType/PostCountryEntityTypeApprove', access, this.getAuthHeadersJSON())
  }

  submitCountryEntityTypeReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/EntityType/PostCountryEntityTypeReject', access, this.getAuthHeadersJSON())
  }

  submitCountryEntityTypeForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/EntityType/PostCountryEntityTypeForward', access, this.getAuthHeadersJSON())
  }

  multipleAPIRequests(request:any){
    return forkJoin(request);
  }
}
