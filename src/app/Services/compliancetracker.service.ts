import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { RegSetupComplianceModel, RegulationSetupDetailsModel, UserRegulationMapping } from '../Models/regulationsetupModel';
import { compliancetracker, ComplianceTrackerModel } from '../Models/compliancetracker';
import { ComplianceTypeRegulationSetupModel, PostRegulationGroupModel, RegulationGroupModel } from '../Models/regulationGroupModel';
import { EntityModel } from '../Models/entityModel';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompliancetrackerService {


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

  getEntities() {
    return this.http.get<Array<EntityModel>>(this.BASEURL + '/ComplianceTracker/GetEntities');
  }

  getEntityById(entityId: any) {
    return this.http.get<EntityModel>(this.BASEURL + '/ComplianceTracker/GetEntityById/' + entityId);
  }

  private childOptionsSubject = new BehaviorSubject<any[]>([]);
  childOptions$ = this.childOptionsSubject.asObservable();

  private gridSubject = new BehaviorSubject<any[]>([]);
  gridSubject$ = this.gridSubject.asObservable();

  setChildOptions(options: any[]) {
    this.childOptionsSubject.next(options);
  }

  LoadGridDetails(list: any[]) {
    this.gridSubject.next(list);
  }

  getAllRegulationComplianceDetails(entityid: any) {
    return this.http.get<Array<compliancetracker>>(this.BASEURL + '/ComplianceTracker/GetRegComplianceDetailsByEntityId/' + entityid, this.getAuthHeadersJSON());
  }


  getRegulationGroupList() {
    return this.http.get<Array<RegulationGroupModel>>(this.BASEURL + '/ComplianceTracker/GetAllRegulationGroups', this.getAuthHeadersJSON());
  }


  postComplianceTracker(compliancetracker: ComplianceTrackerModel) {

    return this.http.post<any>(this.BASEURL + '/ComplianceTracker/PostComplianceTracker', compliancetracker, this.getAuthHeadersJSON())
  }

  getAllCompliances() {
    return this.http.get<Array<RegSetupComplianceModel>>(this.BASEURL + '/ComplianceTracker/GetAllCompliances', this.getAuthHeadersJSON());
  }

  getUserRegulationMapping(id: number | null | undefined) {
    return this.http.get<Array<RegSetupComplianceModel>>(this.BASEURL + '/Access/GetUserRegulationMappingDetails/' + id, this.getAuthHeadersJSON());
  }
  postUserRegulationGroupMapping(regulationGroup: PostRegulationGroupModel) {
    return this.http.post<RegulationGroupModel>(this.BASEURL + '/Access/AddUserRegulationMapping', regulationGroup, this.getAuthHeadersJSON())
  }

  addUserRegulationMapping(data: UserRegulationMapping) {
    return this.http.post(`${this.BASEURL}/Access/AddUserRegulationMapping`, data);
  }

  getComplianceByRegulationId(regulationSetupId: any) {
    return this.http.get<Array<RegSetupComplianceModel>>(
      this.BASEURL + '/ComplianceTracker/GetCompliancesByRegulationSetupId?regulationSetupId=' + regulationSetupId,
      this.getAuthHeadersJSON()
    );
  }

  getComplianceTypeByRegulationSetupId(regulationSetupId?: any, complianceId?: any) {
    let params = [];
    if (regulationSetupId) {
      params.push(`regulationSetupId=${regulationSetupId}`);
    }
    if (complianceId) {
      params.push(`complianceId=${complianceId}`);
    }
    const url = this.BASEURL + '/RegulationSetup/TypeOfComplianceByRegulationSetupIdComplianceId' + (params.length ? '?' + params.join('&') : '');
    return this.http.get<Array<ComplianceTypeRegulationSetupModel>>(url, this.getAuthHeadersJSON());
  }

}
