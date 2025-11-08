import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { AppConfig } from '../app.config'
import { BillingDetailsByEntity, BillingDetailsModel } from '../Models/billingDetailsModel';
import { forkJoin, BehaviorSubject } from 'rxjs';
import { accessModel } from '../Models/pendingapproval';
import { BillingLevelModel } from '../Models/billingLevelModel';
import { BillingFrequencyModel } from '../Models/BillingFrequencyModel';
import { ServiceProviderModel } from '../Models/ServiceProviderModel';
import { BillStatusModel } from '../Models/BillStatusModel';
import { DeliveryStatusModel } from '../Models/DeliveryStatusModel';

@Injectable(
  {
    providedIn: 'root'
  }
)

export class BillingDetailsService {
  private selectedEntitySource: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private BASEURL: any = '';
  public error: any;
  friends: Array<any> = [];
  public headers: Array<any> = [];
  private clearFormEvent: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

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
    var currentU: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currentU);
    if (currentUser && currentUser.access_token) {
      return { headers: { 'Authorization': 'Bearer ' + currentUser.access_token } };

    }
    return { headers: { 'Authorization': 'Bearer ' } };
  }

  getAuthHeadersJSON() {
    var currentU: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currentU);
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

  getAllBillingLevel() {
    return this.http.get<Array<BillingLevelModel>>(this.BASEURL + '/BillingDetails/GetAllBillingLevel', this.getAuthHeadersJSON());
  }

  getAllBillingFrequency() {
    return this.http.get<Array<BillingFrequencyModel>>(this.BASEURL + '/BillingDetails/GetAllBillingFrequency', this.getAuthHeadersJSON());
  }

  getAllServiceProvider() {
    return this.http.get<Array<ServiceProviderModel>>(this.BASEURL + '/BillingDetails/GetAllServiceProvider', this.getAuthHeadersJSON());
  }

  getAllBillStatus() {
    return this.http.get<Array<BillStatusModel>>(this.BASEURL + '/BillingDetails/GetAllBillStatus', this.getAuthHeadersJSON());
  }

  getAllDeliveryStatus() {
    return this.http.get<Array<DeliveryStatusModel>>(this.BASEURL + '/BillingDetails/GetAllDeliveryStatus', this.getAuthHeadersJSON());
  }

  postBillingDetails(billing: BillingDetailsModel) {
    return this.http.post<any>(this.BASEURL + '/BillingDetails/PostBillingDetails', billing, this.getAuthHeadersJSON())
  }

  GetBillingDetailsView(billingDetailId: any) {
    return this.http.get<BillingDetailsModel>(this.BASEURL + '/BillingDetails/GetBillingDetailsView?billingDetailId=' + billingDetailId, this.getAuthHeadersJSON())
  }

  GetBillingDetailsViewByOrgId(organizationId: any) {
    return this.http.get<Array<BillingDetailsModel>>(this.BASEURL + '/BillingDetails/GetBillingDetailsViewByOrgId?organizationId=' + organizationId, this.getAuthHeadersJSON())
  }

  GetBillingDetailsByEntityId(entityId: any) {
    return this.http.get<Array<BillingDetailsByEntity>>(this.BASEURL + '/BillingDetails/GetBillingDetailsByEntityAsync?entityId=' + entityId, this.getAuthHeadersJSON())
  }

  submitBillingApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/BillingDetails/PostBillingApprove', access, this.getAuthHeadersJSON())
  }

  submitBillingReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/BillingDetails/PostBillingReject', access, this.getAuthHeadersJSON())
  }

  submitBillingForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/BillingDetails/PostBillingForward', access, this.getAuthHeadersJSON())
  }

  multipleAPIRequests(request: any) {
    return forkJoin(request);
  }

}