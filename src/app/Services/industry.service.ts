import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { CountryMajorMapping, MajorMinorMapping ,MajorIndustryModel, MinorIndustrypModel, MajorMinorIndustryApproval, IndustryApproval, IndustryMapping } from '../models/industrysetupModel';
import { forkJoin } from 'rxjs';
import { accessModel } from '../models/pendingapproval';

@Injectable({
  providedIn: 'root'
})

@Injectable()
export class IndustryService {

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

  getAllMajorIndustries() {
    return this.http.get<Array<MajorIndustryModel>>(this.BASEURL + '/Industry/GetAllMajorIndustries', this.getAuthHeadersJSON());
  }

  getMajorIndustryById(CountryId:any) {
    return this.http.get<Array<MajorIndustryModel>>(this.BASEURL + '/Industry/GetMajorIndustryById/' + CountryId, this.getAuthHeadersJSON());
  }

  // postMinorIndustry(state: StatesModel) {
  //   return this.http.post<StatesModel>(this.BASEURL + '/Country/PostState', state, this.getAuthHeadersJSON())
  // }

  getMinorIndustryById(majorIndustryId:any) {
    return this.http.get<Array<MinorIndustrypModel>>(this.BASEURL + '/Industry/GetMinorIndustryById/' + majorIndustryId, this.getAuthHeadersJSON());
  }

  postMajorIndustry(majorIndustry: MajorIndustryModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostMajorIndustry', majorIndustry, this.getAuthHeadersJSON())
  }

  postMinorIndustry(minorIndustry: MinorIndustrypModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostMinorIndustry', minorIndustry, this.getAuthHeadersJSON())
  }

  getCountryMajorMapping() {
    return this.http.get<Array<CountryMajorMapping>>(this.BASEURL + '/Industry/GetCountryMajorMapping', this.getAuthHeadersJSON());
  }

  postCountryMajorMapping(countryMajor: IndustryMapping) {
    return this.http.post<IndustryMapping>(this.BASEURL + '/Industry/PostCountryMajorMapping', countryMajor, this.getAuthHeadersJSON())
  }

  getMajorMinorMapping() {
    return this.http.get<Array<MajorMinorMapping>>(this.BASEURL + '/Industry/GetMajorMinorMapping', this.getAuthHeadersJSON());
  }

  postMajorMinorMapping(majorMinor: MajorMinorMapping) {
    return this.http.post<MajorMinorMapping>(this.BASEURL + '/Industry/PostMajorMinorMapping', majorMinor, this.getAuthHeadersJSON())
  }

  getMajorIndustryApprovalList(UserUID:any) {
    return this.http.get<Array<CountryMajorMapping>>(this.BASEURL + '/Industry/GetMajorIndustryApproval/'+UserUID, this.getAuthHeadersJSON());
  }

  getMinorIndustryApprovalList(UserUID:any) {
    return this.http.get<Array<MajorMinorIndustryApproval>>(this.BASEURL + '/Industry/GetMinorIndustryApproval/'+UserUID, this.getAuthHeadersJSON());
  }

  GetIndustryMappingApproval(UserUID:any) {
    return this.http.get<Array<IndustryApproval>>(this.BASEURL + '/Industry/GetIndustryMappingApproval/'+UserUID, this.getAuthHeadersJSON());
  }

  GetMajorMinorMappingApproval(UserUID:any) {
    return this.http.get<Array<MajorMinorIndustryApproval>>(this.BASEURL + '/Industry/GetMajorMinorMappingApproval/'+UserUID, this.getAuthHeadersJSON());
  }

  submitMajorIndustryApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostMajorIndustryApprove', access, this.getAuthHeadersJSON())
  }

  submitMajorIndustryReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostMajorIndustryReject', access, this.getAuthHeadersJSON())
  }

  submitMajorIndustryForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostMajorIndustryForward', access, this.getAuthHeadersJSON())
  }

  getIndustryMapping() {
    return this.http.get<Array<IndustryMapping>>(this.BASEURL + '/Industry/GetIndustryMapping', this.getAuthHeadersJSON());
  }

  getMajorMinorApprovalList(UserUID:any) {
    return this.http.get<Array<MajorMinorIndustryApproval>>(this.BASEURL + '/Industry/GetIndustryApproval/'+UserUID, this.getAuthHeadersJSON());
  }

  submitMinorIndustryApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostMinorIndustryApprove', access, this.getAuthHeadersJSON())
  }

  submitMinorIndustryReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostMinorIndustryReject', access, this.getAuthHeadersJSON())
  }

  submitMinorIndustryForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostMinorIndustryForward', access, this.getAuthHeadersJSON())
  }

  submitCountryMajorApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostCountryMajorApprove', access, this.getAuthHeadersJSON())
  }

  submitCountryMajorReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostCountryMajorReject', access, this.getAuthHeadersJSON())
  }

  submitCountryMajorIndustryForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostCountryMajorIndustryForward', access, this.getAuthHeadersJSON())
  }

  submitMajorMinorApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostMajorMinorApprove', access, this.getAuthHeadersJSON())
  }

  submitMajorMinorReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostMajorMinorReject', access, this.getAuthHeadersJSON())
  }

  submitMajorMinorIndustryForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Industry/PostMajorMinorIndustryForward', access, this.getAuthHeadersJSON())
  }

  multipleAPIRequests(request:any){
    return forkJoin(request);
  }
}
