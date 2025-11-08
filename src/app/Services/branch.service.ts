import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { BranchModel, TOBApproval, TOBMapping } from '../Models/branchModel';
import { forkJoin } from 'rxjs';
import { accessModel, pendingApproval } from '../Models/pendingapproval';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
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

  postBranch(branch: BranchModel) {
    return this.http.post<any>(this.BASEURL + '/TOB/AddTOBDetails', branch, this.getAuthHeadersJSON())
  }

  getAllTOB() {
    return this.http.get<Array<BranchModel>>(this.BASEURL + '/TOB/GetTOBList', this.getAuthHeadersJSON());
  }

  getTOBHistory(uid: any) {
    return this.http.get<Array<BranchModel>>(this.BASEURL + '/TOB/GetTOBHistory/'+ uid, this.getAuthHeadersJSON());
  }

  getTOBApprovalList(UserUID:any) {
    return this.http.get<Array<TOBApproval>>(this.BASEURL + '/TOB/GetTOBMappingApproval/'+UserUID, this.getAuthHeadersJSON());
  }

  getTOBMapping() {
    return this.http.get<Array<TOBMapping>>(this.BASEURL + '/TOB/GetTOBMapping', this.getAuthHeadersJSON());
  }

  GetTOBMappingApproval(UserUID:any) {
    return this.http.get<Array<TOBApproval>>(this.BASEURL + '/TOB/GetTOBMappingApproval/'+UserUID, this.getAuthHeadersJSON());
  }

  GetPendingTOBApproval(uid: any) {
    return this.http.get<Array<TOBApproval>>(this.BASEURL + '/TOB/GetPendingTOBApproval/' + uid, this.getAuthHeadersJSON());
  }

  getTOBMappingByCountry(CountryId:any) {
    return this.http.get<Array<TOBApproval>>(this.BASEURL + '/TOB/GetTOBMappingByCountry?countryId='+CountryId, this.getAuthHeadersJSON());
  }

  getTOBMappingByMajor(MajorIndustryId:any, CountryId:any) {
    return this.http.get<Array<TOBApproval>>(this.BASEURL + '/TOB/GetTOBMappingByMajor?majorInudustryId='+MajorIndustryId + '&countryId='+CountryId, this.getAuthHeadersJSON());
  }

  getTOBMappingByMinor(MinorIndustryId:any, MajorIndustryId:any, CountryId:any) {
    return this.http.get<Array<TOBApproval>>(this.BASEURL + '/TOB/GetTOBMappingByMinor?minorInudustryId='+MinorIndustryId + '&majorInudustryId='+MajorIndustryId + '&countryId='+CountryId, this.getAuthHeadersJSON());
  }

  submitTOBApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/TOB/ApproveTOB', access, this.getAuthHeadersJSON())
  }

  submitTOBReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/TOB/RejectTOB', access, this.getAuthHeadersJSON())
  }

  submitTOBMappingApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/TOB/PostTOBMappingApprove', access, this.getAuthHeadersJSON())
  }

  submitTOBMappingReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/TOB/PostTOBMappingReject', access, this.getAuthHeadersJSON())
  }

  postTOBMapping(tob: TOBMapping) {
    return this.http.post<TOBMapping>(this.BASEURL + '/TOB/PostTOBMapping', tob, this.getAuthHeadersJSON())
  }


  multipleAPIRequests(request:any){
    return forkJoin(request);
  }
  getNextTOBCode(){
    return this.http.get<string>(this.BASEURL + '/TOB/GetNextTOBCode', this.getAuthHeadersJSON());
  }
}
