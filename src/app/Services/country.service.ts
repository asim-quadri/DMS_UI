import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { AppConfig } from '../app.config'
import { CountryModel, CountryStateApproval, CountryStateMapping, StatesModel } from '../models/countryModel';
import { forkJoin } from 'rxjs';
import { accessModel } from '../models/pendingapproval';




@Injectable()

export class CountryService {

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

  postCountry(country: CountryModel) {
    return this.http.post<any>(this.BASEURL + '/Country/PostCountry', country, this.getAuthHeadersJSON())
  }

  getAllCountryMaster() {
    return this.http.get<Array<CountryModel>>(this.BASEURL + '/Country/GetAllCountryMaster', this.getAuthHeadersJSON());
  }

  getAllCountries() {
    return this.http.get<Array<CountryModel>>(this.BASEURL + '/Country/GetAllCountries', this.getAuthHeadersJSON());
  }

  getCountryByOrgId(orgId:any){
    return this.http.get<Array<CountryModel>>(this.BASEURL + '/Country/GetCountryByOrgId/'+ orgId, this.getAuthHeadersJSON());
  }

  postState(state: StatesModel) {
    return this.http.post<StatesModel>(this.BASEURL + '/Country/PostState', state, this.getAuthHeadersJSON())
  }

  getSateById(CountryId:any) {
    return this.http.get<Array<StatesModel>>(this.BASEURL + '/Country/GetStateById/'+CountryId, this.getAuthHeadersJSON());
  }

  getCountryStateMapping() {
    return this.http.get<Array<CountryStateMapping>>(this.BASEURL + '/Country/GetCountryStateMapping', this.getAuthHeadersJSON());
  }

  postCountryStateMapping(country: CountryStateMapping) {
    return this.http.post<CountryStateMapping>(this.BASEURL + '/Country/PostCountryStateMapping', country, this.getAuthHeadersJSON())
  }

  deleteCountryStateMapping(country: CountryStateMapping) {
    return this.http.post<CountryStateMapping>(this.BASEURL + '/Country/DeleteCountryStateMapping', country, this.getAuthHeadersJSON())
  }



  getCountrySateApprovalList(UserUID:any) {
    return this.http.get<Array<CountryStateApproval>>(this.BASEURL + '/Country/GetCountryStateApproval/'+UserUID, this.getAuthHeadersJSON());
  }

  GetCountryStateMappingApproval(UserUID:any) {
    return this.http.get<Array<CountryStateApproval>>(this.BASEURL + '/Country/GetCountryStateMappingApproval/'+UserUID, this.getAuthHeadersJSON());
  }


  submitCountryApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Country/PostCountryApprove', access, this.getAuthHeadersJSON())
  }

  submitCountryReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Country/PostCountryReject', access, this.getAuthHeadersJSON())
  }

  submitCountryForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Country/PostCountryForward', access, this.getAuthHeadersJSON())
  }


  submitStateApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Country/PostStateApprove', access, this.getAuthHeadersJSON())
  }

  submitStateReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Country/PostStateReject', access, this.getAuthHeadersJSON())
  }

  submitStateForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Country/PostStateForward', access, this.getAuthHeadersJSON())
  }


  submitCountryStateApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Country/PostCountryStateApprove', access, this.getAuthHeadersJSON())
  }

  submitCountryStateReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Country/PostCountryStateReject', access, this.getAuthHeadersJSON())
  }

  submitCountryStateForword(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Country/PostCountryStateForward', access, this.getAuthHeadersJSON())
  }

  multipleAPIRequests(request:any){
    return forkJoin(request);
  }
}
