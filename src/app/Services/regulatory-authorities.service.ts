import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { BaseResult } from '../Product_Owner/client/service-request/ServiceRequest';
import { CountryRegulatoryAuthorityMapping, PostRegulatoryAuthorities, RegulatoryAuthorities } from '../Models/postRegulatoryAuthorities';
import { forkJoin, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegulatoryAuthorityService {
  private BASEURL: any = '';
  private ApiBaseLink = '/RegulatoryAuthority/';
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

  postRegulatoryAuthority(
    data: PostRegulatoryAuthorities
  ): Observable<BaseResult> {
    const url = `${this.BASEURL}PostRegulatoryAuthority`;
    return this.http.post<BaseResult>(url, data, this.getAuthHeadersJSON());
  }
  
    getNextRegulatoryAuthRefCode(): Observable<string> {
        const url = `${this.BASEURL}GetNextRegulatoryAuthRefCode`;
        return this.http.get<string>(url, this.getAuthHeadersJSON());
    }
    getAllRegulatoryAuthorities(): Observable<Array<RegulatoryAuthorities>> {
      const url = `${this.BASEURL}GetAllRegulatoryAuthorities`;
      return this.http.get<Array<RegulatoryAuthorities>>(url, this.getAuthHeadersJSON());
    }
    getAllPendingRegAuth(id: number): Observable<PostRegulatoryAuthorities[]> {
      const url = `${this.BASEURL}GetAllPendingRegAuth/${id}`;
      return this.http.get<PostRegulatoryAuthorities[]>(url, this.getAuthHeadersJSON());
    }
     multipleAPIRequests(request:any){
        return forkJoin(request);
      }
      submitRegulatoryAuthoritiesApprove(data: PostRegulatoryAuthorities): Observable<BaseResult> {
        const url = `${this.BASEURL}SubmitRegulatoryAuthoritiesApprove`;
        return this.http.post<BaseResult>(url, data, this.getAuthHeadersJSON());
      }
      postCountryRegulatoryAuthorityMapping(data: any): Observable<BaseResult> {
        const url = `${this.BASEURL}PostCountryRegulatoryAuthorityMapping`;
        return this.http.post<BaseResult>(url, data, this.getAuthHeadersJSON());
      }
      getAllPendingRegAuthMapping(id: number): Observable<Array<CountryRegulatoryAuthorityMapping>> {
        const url = `${this.BASEURL}GetAllPendingRegAuthMapping/${id}`;
        return this.http.get<Array<CountryRegulatoryAuthorityMapping>>(url, this.getAuthHeadersJSON());
      }
      submitRegulatoryAuthoritiesMappingApprove(data: CountryRegulatoryAuthorityMapping): Observable<BaseResult> {
        const url = `${this.BASEURL}SubmitRegulatoryAuthoritiesMappingApprove`;
        return this.http.post<BaseResult>(url, data, this.getAuthHeadersJSON());
      }

      getAllRegAuthMapping(): Observable<Array<CountryRegulatoryAuthorityMapping>> {
        const url = `${this.BASEURL}GetAllRegAuthMapping`;
        return this.http.get<Array<CountryRegulatoryAuthorityMapping>>(url, this.getAuthHeadersJSON());
      }
       getRegulatoryAuthoritiesListCountry(countryId: number): Observable<Array<RegulatoryAuthorities>> {
        const url = `${this.BASEURL}GetRegulatoryAuthoritiesListCountry/${countryId}`;
        return this.http.get<Array<RegulatoryAuthorities>>(url, this.getAuthHeadersJSON());
      }
      
} 
