import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { Injectable } from "@angular/core";
import { ConcernedMinistry, CountryConcernedMinistryMapping, postConcernedMinistry } from "../Models/postConcernedMinistry";
import { BaseResult } from "../Product_Owner/client/service-request/ServiceRequest";
import { forkJoin, Observable } from "rxjs";

@Injectable({
  providedIn: 'root',
})

export class ConcernedMinistryService {
  private BASEURL: any = '';
  private ApiBaseLink = '/ConcernedMinistry/';
  public error: any;
  public headers: Array<any> = [];

  constructor(public http: HttpClient, private config: AppConfig) {
    this.BASEURL = `${this.config.ServiceUrl}${this.ApiBaseLink}`;
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
      return {
        headers: { Authorization: 'Bearer ' + currentUser.access_token },
      };
    }
    return { headers: { Authorization: 'Bearer ' } };
  }

  getAuthHeadersJSON() {
    var currnetu: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currnetu);
    if (currentUser && currentUser.access_token) {
      return {
        headers: {
          Authorization: 'Bearer ' + currentUser.access_token,
          'Content-Type': 'application/json',
        },
      };
    }
    return {
      headers: { Authorization: 'Bearer ', 'Content-Type': 'application/json' },
    };
  }

  getImageAuthHeadersJSON() {
    return { headers: undefined };
  }

  getHeadersJSON() {
    return { headers: { 'Content-Type': 'application/json' } };
  }

  postConcernedMinistry(postConcernedMinistry: postConcernedMinistry): Observable<BaseResult> {
    const url = `${this.BASEURL}PostConcernedMinistry`;
    return this.http.post<BaseResult>(url, postConcernedMinistry, this.getAuthHeadersJSON());
  }
  getNextConcernedMinistryRefCode(): Observable<string> {
    const url = `${this.BASEURL}GetNextConcernedMinistryRefCode`;
    return this.http.get<string>(url, this.getAuthHeadersJSON());
  }
  getAllConcernedMinistry(): Observable<Array<ConcernedMinistry>> {
    const url = `${this.BASEURL}GetAllConcernedMinistry`;
    return this.http.get<Array<ConcernedMinistry>>(url, this.getAuthHeadersJSON());
  }
  getAllPendingConcernedMinistry(id: number): Observable<Array<postConcernedMinistry>> {
    const url = `${this.BASEURL}GetAllPendingConcernedMinistry/${id}`;
    return this.http.get<Array<postConcernedMinistry>>(url, this.getAuthHeadersJSON());
  }
  submitConcernedMinistriesApprove(postConcernedMinistry: postConcernedMinistry): Observable<BaseResult> {
    const url = `${this.BASEURL}SubmitConcernedMinistriesApprove`;
    return this.http.post<BaseResult>(url, postConcernedMinistry, this.getAuthHeadersJSON());
  }
  postCountryConcernedMinistryMapping(countryConcernedMinistry: any): Observable<any> {
    const url = `${this.BASEURL}PostCountryConcernedMinistryMapping`;
    return this.http.post<any>(url, countryConcernedMinistry, this.getAuthHeadersJSON());
  }
  getAllPendingConcernedMinistryMapping(id: number): Observable<Array<CountryConcernedMinistryMapping>> {
    const url = `${this.BASEURL}GetAllPendingConcernedMinistryMapping/${id}`;
    return this.http.get<Array<CountryConcernedMinistryMapping>>(url, this.getAuthHeadersJSON());
  }

  submitConcernedMinistriesMappingApprove(countryConcernedMinistry: CountryConcernedMinistryMapping): Observable<BaseResult> {
    const url = `${this.BASEURL}SubmitConcernedMinistriesMappingApprove`;
    return this.http.post<BaseResult>(url, countryConcernedMinistry, this.getAuthHeadersJSON());
  }
  getAllConcernedMinistryMapping(): Observable<Array<CountryConcernedMinistryMapping>> {
    const url = `${this.BASEURL}GetAllConcernedMinistryMapping`;
    return this.http.get<Array<CountryConcernedMinistryMapping>>(url, this.getAuthHeadersJSON());
  }
  getConcernedMinistryListCountry(countryId: number): Observable<Array<ConcernedMinistry>> {
    const url = `${this.BASEURL}GetConcernedMinistryListCountry/${countryId}`;
    return this.http.get<Array<ConcernedMinistry>>(url, this.getAuthHeadersJSON());
  }

    multipleAPIRequests(request:any){
          return forkJoin(request);
        }
}