import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { AppConfig } from '../app.config'
import { EntityModel, EntityHistory, EntityApproval, EntityApprovalList } from '../Models/entityModel';
import { forkJoin, BehaviorSubject } from 'rxjs';
import { accessModel } from '../Models/pendingapproval';
import { MajorMinorMapping } from '../Models/industrysetupModel';

@Injectable(
  {
    providedIn: 'root'
  }
)

export class EntityService {
  private selectedEntitySource: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private BASEURL: any = '';
  public error: any;
  friends: Array<any> = [];
  public headers: Array<any> = [];
  private clearFormEvent: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

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
    var currentU: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currentU);
    if (currentUser && currentUser.access_token) {
      return { headers: { 'Authorization': 'Bearer ' + currentUser.access_token } };

    }
    return { headers: { 'Authorization': 'Bearer ' } };
  }

  getAuthHeadersJSON() {
    var currentU: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currentU);
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

  getEntityApprovalList(userId: any) {

    return this.http.get<Array<EntityApprovalList>>(this.BASEURL + '/Entity/GetEntityApprovalList/' + userId, this.getAuthHeadersJSON())
  }

  getEntityDetails(EntityId: any) {

    return this.http.get<EntityModel>(this.BASEURL + '/Entity/GetEntityDetails?entityId=' + EntityId, this.getAuthHeadersJSON())
  }

  GetEntityView(EntityId: any) {

    return this.http.get<EntityModel>(this.BASEURL + '/Entity/GetEntityView?entityId=' + EntityId, this.getAuthHeadersJSON())
  }

  getStartAndEndMonthsByCountryId(countryId: any) {

    return this.http.get<any>(this.BASEURL + '/Entity/GetStartAndEndMonthsByCountryId?countryId=' + countryId, this.getAuthHeadersJSON())
  }

  postEntity(entity: EntityModel) {

    return this.http.post<any>(this.BASEURL + '/Entity/PostEntity', entity, this.getAuthHeadersJSON())
  }

  submitEntityApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Entity/PostEntityApprove', access, this.getAuthHeadersJSON())
  }

  submitEntityReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Entity/PostEntityReject', access, this.getAuthHeadersJSON())
  }

  submitEntityForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Entity/PostEntityForward', access, this.getAuthHeadersJSON())
  }

  multipleAPIRequests(request: any) {
    return forkJoin(request);
  }

  setClearForm(flag: boolean): void {
    this.clearFormEvent.next(true);
  }
  getClearForm() {
    return this.clearFormEvent.asObservable();
  }
  GetMinorIndustrybyMajorID(countryId: any) {
    return this.http.get<Array<MajorMinorMapping>>(this.BASEURL + '/RegulationSetup/GetMinorIndustrybyMajorID?majorIndustoryId=' + countryId, this.getAuthHeadersJSON());
  }

  GetEntitiesByOrganizationIdByCountryId(organizationId: any, countryId: any) {
    return this.http.get<Array<EntityModel>>(this.BASEURL + '/Entity/GetEntitiesByOrganizationAndCountryId/' + organizationId + '/' + countryId, this.getAuthHeadersJSON());
  }

  GetEntitiesByOrganizationId(organizationId: any) {
    return this.http.get<Array<EntityModel>>(this.BASEURL + '/Entity/GetEntitiesByOrganizationId/' + organizationId, this.getAuthHeadersJSON());
  }
}