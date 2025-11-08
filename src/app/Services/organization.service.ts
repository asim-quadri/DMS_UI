import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { AppConfig } from '../app.config'
import { OrganizationModel, OrganizationHistory, OrganizationApproval, OrganizationDetail, OrganizationEntityList } from '../Models/organizationModel';
import { forkJoin, BehaviorSubject } from 'rxjs';
import { accessModel } from '../Models/pendingapproval';
import { BillingLevelModel } from '../Models/billingLevelModel';
import { ProductTypeModel } from '../Models/productTypeModel';
import { RolesModels } from '../Models/roles';
import { MajorMinorMapping } from '../Models/industrysetupModel';

@Injectable(
  {
    providedIn: 'root'
  }
)

export class OrganizationService {

  private selectedOrganizationSource: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private BASEURL: any = '';
  public error: any;
  friends: Array<any> = [];
  public headers: Array<any> = [];
  private clearFormEvent: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private ogranizationAddOrUpdate: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

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

  setClearForm(flag: boolean): void {
    this.clearFormEvent.next(true);
  }
  getClearForm() {
    return this.clearFormEvent.asObservable();
  }
  setOrgAddOrUpdate(): void {
    this.ogranizationAddOrUpdate.next(true)
  }
  getOrgAddOrUpdate() {
    return this.ogranizationAddOrUpdate.asObservable();
  }

  setSelectedOrganization(organization: any) {
    this.selectedOrganizationSource.next(organization);
  }

  getSelectedOrganization() {
    return this.selectedOrganizationSource.asObservable();
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

  getOrganizationsByUserId(user: any) {
    let url = this.BASEURL + '/Organizations/GetAllOrganization';
    if (user !== null && user !== undefined) {
      url += '?user=' + user;
    }
    return this.http.get<Array<OrganizationModel>>(url, this.getAuthHeadersJSON());
  }

  getOrganizations() {
    return this.http.get<Array<OrganizationModel>>(this.BASEURL + '/Organizations/GetAllOrganizations', this.getAuthHeadersJSON());
  }

  getOrganizationByCountryId(countryId: any) {
    return this.http.get<Array<OrganizationModel>>(this.BASEURL + '/Organizations/GetOrganizationsByCountry/' + countryId, this.getAuthHeadersJSON())
  }
  getOrganizationByCountryIdAndUserId(countryId: any, userId: any) {
    return this.http.get<Array<OrganizationModel>>(this.BASEURL + '/Organizations/GetOrganizationsByUserandCountry/' + userId + '/' + countryId, this.getAuthHeadersJSON())
  }

  getOrganizationWithoutStatus(user: any) {
    let url = this.BASEURL + '/Organizations/GetAllOrganizationWithoutStatus';
    if (user !== null && user !== undefined) {
      url += '?user=' + user;
    }
    return this.http.get<Array<OrganizationDetail>>(url, this.getAuthHeadersJSON());
  }

  getAllBillingLevel() {
    return this.http.get<Array<BillingLevelModel>>(this.BASEURL + '/Organizations/GetAllBillingLevel', this.getAuthHeadersJSON());
  }

  getOrgEntityList() {
    return this.http.get<Array<OrganizationEntityList>>(this.BASEURL + '/Organizations/GetOrgEntityLists', this.getAuthHeadersJSON());
  }
  getOrgEntityListByUserId(UserId: any) {
    return this.http.get<Array<OrganizationEntityList>>(this.BASEURL + '/Organizations/GetOrgEntityList?userId=' + UserId, this.getAuthHeadersJSON());
  }

  getAllProductType() {
    return this.http.get<Array<ProductTypeModel>>(this.BASEURL + '/Organizations/GetAllProductType', this.getAuthHeadersJSON());
  }

  getOrganizationApproval(UserUID: any) {
    return this.http.get<Array<OrganizationApproval>>(this.BASEURL + '/Organizations/GetOrganizationApprovalList/' + UserUID, this.getAuthHeadersJSON())
  }

  getOrganizationById(Id: any) {
    return this.http.get<Array<OrganizationDetail>>(this.BASEURL + '/Organizations/GetOrganizationById/' + Id, this.getAuthHeadersJSON())
  }

  getBillingLevelById(BillingLevel: any) {
    return this.http.get<Array<BillingLevelModel>>(this.BASEURL + '/Country/GetBillingLevelById/' + BillingLevel, this.getAuthHeadersJSON());
  }

  postOrganization(organization: OrganizationModel) {

    return this.http.post<any>(this.BASEURL + '/Organizations/PostOrganization', organization, this.getAuthHeadersJSON())
  }

  submitOrganizationApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Organizations/PostOrganizationApprove', access, this.getAuthHeadersJSON())
  }

  submitOrganizationReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Organizations/PostOrganizationReject', access, this.getAuthHeadersJSON())
  }

  submitOrganizationForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Organizations/PostOrganizationForward', access, this.getAuthHeadersJSON())
  }

  multipleAPIRequests(request: any) {
    return forkJoin(request);
  }

  getAllRoles() {
    return this.http.get<Array<RolesModels>>(this.BASEURL + '/UserManagement/GetAllRoles', this.getAuthHeadersJSON());
  }

  GetMinorIndustrybyMajorID(countryId: any) {
    return this.http.get<Array<MajorMinorMapping>>(this.BASEURL + '/RegulationSetup/GetMinorIndustrybyMajorID?majorIndustoryId=' + countryId, this.getAuthHeadersJSON());
  }
}