import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CountryModel } from "../Models/countryModel";
import { regulationComplianceWithCountryModel, ReportMaster } from "../Models/reportModel";
import { RegulationSetupModule } from "../Product_Owner/product-setup/regulation-setup/regulation-setup.module";
import { RegulationDetailsByCountryIdModel, RegulationSetupDetailsModel } from "../Models/regulationsetupModel";
import { EntityTypeModel } from "../Models/entityTypeModel";
import { IndustryMapping } from "../Models/industrysetupModel";

@Injectable({
  providedIn: 'root'
})

export class ReportService {

    
      private BASEURL: any = '';
      private UrlConstant:string='Report';
      public error: any;
    
    
      friends: Array<any> = [];
      public headers: Array<any> = [];
    
      constructor(public http: HttpClient, private config: AppConfig) {
    
        this.BASEURL = `${this.config.ServiceUrl}/${this.UrlConstant}`;
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
      getAllCountries(): Observable<Array<CountryModel>> {
        const url = `${this.BASEURL}/GetAllCountries`;
        return this.http.get<Array<CountryModel>>(url, this.getAuthHeadersJSON());
      }

      getAllReportMaster(): Observable<Array<ReportMaster>> {
        const url = `${this.BASEURL}/GetAllReportMaster`;
        return this.http.get<Array<ReportMaster>>(url, this.getAuthHeadersJSON());
      }
      getAllRegulationWithCountries(): Observable<Array<RegulationDetailsByCountryIdModel>> {
        const url = `${this.BASEURL}/GetAllRegulationWithCountries`;
        return this.http.get<Array<RegulationDetailsByCountryIdModel>>(url, this.getAuthHeadersJSON());
      }
      getAllComplianceWithCountries(): Observable<Array<regulationComplianceWithCountryModel>> {
        const url = `${this.BASEURL}/GetAllComplianceWithCountriesReports`;
        return this.http.get<Array<regulationComplianceWithCountryModel>>(url, this.getAuthHeadersJSON());
      }
      getAllEntityType(): Observable<Array<EntityTypeModel>> {
        const url = `${this.BASEURL}/GetAllEntityTypeWithCountry`;
        return this.http.get<Array<EntityTypeModel>>(url, this.getAuthHeadersJSON());
      }
      getAllIndustryCountry(): Observable<Array<IndustryMapping>> {
        const url = `${this.BASEURL}/GetIndustryMappingWithCountry`;
        return this.http.get<Array<IndustryMapping>>(url, this.getAuthHeadersJSON());
      }

}