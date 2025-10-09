import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { ParameterModel } from '../models/parameter';
import { RegSetupComplianceModel, RegulationDetailsByCountryIdModel, RegulationSetupDetailsModel, RegulationSetupParameterModel, ReuglationListModle } from '../models/regulationsetupModel';
import { RegulationGroupModel } from '../models/regulationGroupModel';
import { accessModel, pendingApproval } from '../models/pendingapproval';
import { TOC, TOCRegistration, TOCRules } from '../models/TOC';
import { Observable } from 'rxjs';
import { CountryStateMapping } from '../models/countryModel';
import { IndustryMapping } from '../models/industrysetupModel';

@Injectable({
  providedIn: 'root'
})
export class RegulationSetupService {

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

  getAllRegulationSetupDetails(regSetupuid : any) {
    return this.http.get<Array<RegulationSetupDetailsModel>>(this.BASEURL + '/RegulationSetup/GetRegulationSetupDetails/' + regSetupuid, this.getAuthHeadersJSON());
  }

  getRegulationSetupHistory() {
    return this.http.get<Array<ReuglationListModle>>(this.BASEURL + '/RegulationSetup/GetRegSetupHistory', this.getAuthHeadersJSON());
  }

  getHistoryRegulationSetupByID(uid: any) {
    return this.http.get<RegulationSetupDetailsModel>(this.BASEURL + '/RegulationSetup/GetHistoryRegSetup/' + uid, this.getAuthHeadersJSON());
  }

  getDetailsByCountryIdRegSetup(countryId: any) {
    return this.http.get<Array<any>>(this.BASEURL + '/RegulationSetup/GetAllRegulationBasicAndParameterByCountryID/' + countryId, this.getAuthHeadersJSON());
  }

  submitReject(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/RegulationSetup/RejectRegulationSetup', access, this.getAuthHeadersJSON())
  }

  submitReviewed(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/RegulationSetup/ApproveRegulationSetup', access, this.getAuthHeadersJSON())
  }

  submitApproved(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/RegulationSetup/ApproveRegulationSetup', access, this.getAuthHeadersJSON())
  }

  getAllRegulationSetupParameters() {
    return this.http.get<Array<RegulationSetupParameterModel>>(this.BASEURL + '/RegulationSetup/GetRegulationSetupParameters', this.getAuthHeadersJSON());
  }

  addRegulationSetupDetails(regulationDetails: RegulationSetupDetailsModel) {
    return this.http.post<any>(this.BASEURL + '/ParameterSetup/AddRegulationSetupDetails', regulationDetails, this.getAuthHeadersJSON())
  }

  addRegulationSetupParameters(regulationParameter: RegulationSetupParameterModel, accessUID: any = '') {
    return this.http.post<any>(this.BASEURL + '/ParameterSetup/AddRegulationSetupParameters?accessUID=' + accessUID, regulationParameter, this.getAuthHeadersJSON())
  }

  getCountryStateMapping() {
    return this.http.get<Array<CountryStateMapping>>(this.BASEURL + '/Country/GetCountryStateMapping', this.getAuthHeadersJSON());
  }

  getIndustryMapping() {
    return this.http.get<Array<IndustryMapping>>(this.BASEURL + '/Industry/GetIndustryMapping', this.getAuthHeadersJSON());
  }

  addRegulationSetup(regulationSetup: RegulationDetailsByCountryIdModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationSetup/AddRegulationSetupDetails', regulationSetup, this.getAuthHeadersJSON())
  }

  GetRegulationSetupCompliance(complianceId: any) {
    return this.http.get<Array<any>>(this.BASEURL + '/RegulationSetup/GetRegulationSetupCompliance/' + complianceId, this.getAuthHeadersJSON());
  }

  addCompliance(regulationDetails: RegSetupComplianceModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationSetup/AddRegSetupComplianceAsync', regulationDetails, this.getAuthHeadersJSON())
  }

  GetPendingRegSetupApproval(uid: any) {
    return this.http.get<Array<pendingApproval>>(this.BASEURL + '/RegulationSetup/GetPendingRegulationSetupApproval/' + uid, this.getAuthHeadersJSON());
  }

  GetRegSetupComplianceHistory(uid: any) {
    return this.http.get<Array<RegSetupComplianceModel>>(this.BASEURL + '/RegulationSetup/GetRegSetupComplianceHistory/' + uid, this.getAuthHeadersJSON());
  }

  RegComplianceApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationSetup/ApproveRegSetupCompliance', access, this.getAuthHeadersJSON())
  }


  RegComplianceReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationSetup/RejectRegSetupCompliance', access, this.getAuthHeadersJSON())
  }

  GetTOCRules(complianceId: any, regulationid:any,ruleType: any)  {
    return this.http.get<Array<TOCRules>>(`${this.BASEURL}/RegulationSetup/GetTOCRulesAsync/${complianceId}/${regulationid}/${ruleType}`, this.getAuthHeadersJSON());
  }

  addTOCRules(tOCRules: TOCRules) {
    return this.http.post<any>(this.BASEURL + '/RegulationSetup/PostTOCRules', tOCRules, this.getAuthHeadersJSON())
  }

  GetTOCRegistration(complianceId: any,regulationid:any, ruleType: any) {
    return this.http.get<Array<TOCRegistration>>(`${this.BASEURL}/RegulationSetup/GetTOCRegistration/${complianceId}/${regulationid}/${ruleType}`, this.getAuthHeadersJSON());
  }

  addTOCRegistration(regulationDetails: TOCRegistration) {
    return this.http.post<any>(this.BASEURL + '/RegulationSetup/PostTOCRegistration', regulationDetails, this.getAuthHeadersJSON())
  }

  GetTOCHistory(historyid: any) {
    return this.http.get<Array<RegSetupComplianceModel>>(this.BASEURL + '/RegulationSetup/GetTOCHistory/' + historyid, this.getAuthHeadersJSON());
  }

  TOCRegistationApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationSetup/ApproveTOCRegistration', access, this.getAuthHeadersJSON())
  }


  TOCRegistationReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationSetup/RejectTOCRegistration', access, this.getAuthHeadersJSON())
  }

  TOCRulesApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/RegulationSetup/ApproveTOCRule', access, this.getAuthHeadersJSON())
  }
}
