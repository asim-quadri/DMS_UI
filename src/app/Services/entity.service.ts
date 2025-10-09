import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { AppConfig } from '../app.config'
import { EntityModel, EntityHistory, EntityApproval, EntityApprovalList } from '../models/entityModel';
import { forkJoin, BehaviorSubject  } from 'rxjs';
import { accessModel } from '../models/pendingapproval';

@Injectable(
  {
    providedIn: 'root'
  }
)

export class EntityService {
  private selectedEntitySource : BehaviorSubject<any> = new BehaviorSubject<any>(null);
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

  getEntityApprovalList(userId : any)  {
    debugger;
    return this.http.get<Array<EntityApprovalList>>(this.BASEURL + '/Entity/GetEntityApprovalList/'+userId, this.getAuthHeadersJSON())
  }

  getEntityDetails(EntityId : any) {
    debugger;
    return this.http.get<EntityModel>(this.BASEURL + '/Entity/GetEntityDetails?entityId='+EntityId, this.getAuthHeadersJSON())
  }

  GetEntityView(EntityId : any) {
    debugger;
    return this.http.get<EntityModel>(this.BASEURL + '/Entity/GetEntityView?entityId='+EntityId, this.getAuthHeadersJSON())
  }

  postEntity(entity: EntityModel) {

    return this.http.post<any>(this.BASEURL + '/Entity/PostEntity', entity, this.getAuthHeadersJSON())
  }

  submitEntityApproved(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Entity/PostEntityApprove', access, this.getAuthHeadersJSON())
  }

  submitEntityReject(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Entity/PostEntityReject', access, this.getAuthHeadersJSON())
  }

  submitEntityForward(access: accessModel) {
    return this.http.post<any>(this.BASEURL + '/Entity/PostEntityForward', access, this.getAuthHeadersJSON())
  }

  multipleAPIRequests(request:any){
    return forkJoin(request);
  }

  setClearForm(flag: boolean): void {
    this.clearFormEvent.next(true);
  }
  getClearForm(){
    return this.clearFormEvent.asObservable();
  }

  getAllEntityList() {
    return this.http.get<EntityModel>(this.BASEURL + '/Entities')
  }

}
