import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { ParameterModel } from '../Models/parameter';
import { RegSetupComplianceModel, RegulationDetailsByCountryIdModel, RegulationSetupDetailsModel, RegulationSetupParameterModel, ReuglationListModle, TOBMinorIndustryRequest } from '../Models/regulationsetupModel';
import { RegulationGroupModel } from '../Models/regulationGroupModel';
import { accessModel, pendingApproval } from '../Models/pendingapproval';
import { TOC, TOCRegistration, TOCRules } from '../Models/TOC';
import { forkJoin, Observable } from 'rxjs';
import { CountryStateMapping } from '../Models/countryModel';
import { IndustryMapping, MajorMinorMapping } from '../Models/industrysetupModel';
import { TocRegistrationComponent } from '../Product_Owner/product-setup/regulation-setup/TOC/toc-registration/toc-registration.component';

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

  getAllRegulationSetupDetails(regSetupuid: any) {
    return this.http.get<Array<RegulationSetupDetailsModel>>(this.BASEURL + '/RegulationSetup/GetRegulationSetupDetails/' + regSetupuid, this.getAuthHeadersJSON());
  }

  getRegulationSetupHistory(userId?: number | null) {
    let url = this.BASEURL + '/RegulationSetup/GetRegSetupHistory';
    if (userId) {
      url += `?userId=${encodeURIComponent(userId)}`;
    }
    return this.http.get<Array<ReuglationListModle>>(url, this.getAuthHeadersJSON());
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

  getRegulationSetupDetails() {
    return this.http.get<Array<RegulationSetupDetailsModel>>(this.BASEURL + '/RegulationSetup/GetAllRegulationSetupDetails', this.getAuthHeadersJSON());
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

  GetMinorIndustrybyMajorID(countryId: any) {
    return this.http.get<Array<MajorMinorMapping>>(this.BASEURL + '/RegulationSetup/GetMinorIndustrybyMajorID?majorIndustoryId=' + countryId, this.getAuthHeadersJSON());
  }

  GetMinorIndustrybyMajorIDMap(majorIndustryIds: Array<number>, countryId: number) {
    // Add the required headers
    const headers = new HttpHeaders(this.getAuthHeadersJSON().headers);
    return this.http.post<Array<MajorMinorMapping>>(
      `${this.BASEURL}/RegulationSetup/GetMinorIndustrybyMajorIDMap?countryId=` + countryId,
      majorIndustryIds, // Send the array in the request body
      { headers: headers }
    );
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

  GetTOCRules(tocId: any, regulationid: any, ruleType: any) {
    return this.http.get<Array<TOCRules>>(`${this.BASEURL}/RegulationSetup/GetTOCRulesAsync/${tocId}/${regulationid}/${ruleType}`, this.getAuthHeadersJSON());
  }

  addTOCRules(tOCRules: TOCRules) {
    return this.http.post<any>(this.BASEURL + '/RegulationSetup/PostTOCRules', tOCRules, this.getAuthHeadersJSON())
  }

  GetTOCRegistration(tocRegId: any, complianceId: any, regulationid: any, ruleType: any) {
    return this.http.get<Array<TOCRegistration>>(`${this.BASEURL}/RegulationSetup/GetTOCRegistration/${tocRegId}/${complianceId}/${regulationid}/${ruleType}`, this.getAuthHeadersJSON());
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

  getTOBMinorIndustryMapping(request: TOBMinorIndustryRequest): Observable<MajorMinorMapping[]> {
    return this.http.post<MajorMinorMapping[]>(`${this.BASEURL}/RegulationSetup/GetTOBMinorIndustrybyMajorIDMap`, request, this.getAuthHeadersJSON());
  }

  multipleAPIRequests(request: any) {
    return forkJoin(request);
  }
  getNextRegulationSetupCode(){
    return this.http.get<string>(this.BASEURL + '/RegulationSetup/GetNextRegulationSetupCode', this.getAuthHeadersJSON());
  }
  getNextRegulationSetupComplianceCode() {
    return this.http.get<string>(this.BASEURL + '/RegulationSetup/GetNextRegulationSetupComplianceCode', this.getAuthHeadersJSON());
  }
  getNextRegulationSetupTypeOfComplianceRegisterCode(){
    return this.http.get<string>(this.BASEURL + '/RegulationSetup/GetNextRegulationSetupTypeOfComplianceRegisterCode', this.getAuthHeadersJSON());
  }

  getNextRegulationSetupTypeOfComplianceDuesCode() {
    return this.http.get<string>(this.BASEURL + '/RegulationSetup/GetNextRegulationSetupTypeOfComplianceDuesCode', this.getAuthHeadersJSON());
  }

  getAllRegisteration() {
    return this.http.get<Array<TOCRegistration>>(this.BASEURL + '/RegulationSetup/GetAllRegisteration', this.getAuthHeadersJSON());
  }

  getAllTOCDues() {
    return this.http.get<Array<any>>(this.BASEURL + '/RegulationSetup/GetAllTOCDues', this.getAuthHeadersJSON());
  }
}