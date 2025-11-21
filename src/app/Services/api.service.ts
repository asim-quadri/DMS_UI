import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'


import { AppConfig } from '../app.config'
import { UsersModel, loginModel, MenuOptionModel } from '../Models/Users';
import { RolesModels, UpdateRoleModels } from '../Models/roles';
import { Products } from '../Models/products';
import { HeaderMenuItem } from '../Models/HeaderMenuItem';
import { accessModel, pendingApproval } from '../Models/pendingapproval';
import { SetUserAccessModel } from '../Models/SetUserAccessModel';
import { forkJoin } from 'rxjs';


@Injectable()

export class ApiService {

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

  postUser(user: UsersModel, accessUID: string = '') {

    return this.http.post<any>(this.BASEURL + '/UserManagement/PostUser?accessUID=' + accessUID, user, this.getAuthHeadersJSON())
  }


  getAllUsers() {
    return this.http.get<Array<UsersModel>>(this.BASEURL + '/UserManagement/GetAllUsers', this.getAuthHeadersJSON());
  }

  getUserByUID(uid: any) {
    return this.http.get<UsersModel>(this.BASEURL + '/UserManagement/GetUsers/' + uid, this.getAuthHeadersJSON());
  }

  getHistoryUserByID(uid: any) {
    return this.http.get<UsersModel>(this.BASEURL + '/UserManagement/GetHistoryUsers/' + uid, this.getAuthHeadersJSON());
  }

  delteUserByUID(uid: any) {
    return this.http.delete<UsersModel>(this.BASEURL + '/UserManagement/deleteUsers/' + uid + '/0', this.getAuthHeadersJSON());
  }

  updateRoles(roles: UpdateRoleModels) {
    return this.http.post<any>(this.BASEURL + '/UserManagement/UpdateRole', roles, this.getAuthHeadersJSON());
  }

  getAllRoles() {
    return this.http.get<Array<RolesModels>>(this.BASEURL + '/UserManagement/GetAllRoles', this.getAuthHeadersJSON());
  }

  getRoleByUID(uid: any) {
    return this.http.get<RolesModels>(this.BASEURL + '/UserManagement/GetRoles/' + uid, this.getAuthHeadersJSON());
  }

  getHistoryRoleByUID(historyId: any) {
    return this.http.get<RolesModels>(this.BASEURL + '/UserManagement/GetHistoryRoles/' + historyId, this.getAuthHeadersJSON());
  }

  getAllProducts() {
    return this.http.get<Array<Products>>(this.BASEURL + '/UserManagement/GetAllProducts', this.getAuthHeadersJSON());
  }
  login(roles: loginModel) {
    return this.http.post<any>(this.BASEURL + '/UserManagement/Login', roles, this.getAuthHeadersJSON());
  }


  getAllUsersPendingApprovals(userUID: string) {
    return this.http.get<Array<pendingApproval>>(this.BASEURL + '/UserManagement/GetAllUsersApproval/' + userUID, this.getAuthHeadersJSON());
  }

  getAllRolesPendingApprovals(userUID: string) {
    return this.http.get<Array<pendingApproval>>(this.BASEURL + '/UserManagement/GetAllRolesApproval/' + userUID, this.getAuthHeadersJSON());
  }
  submitRoleApproved(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/UserManagement/UpdateApproveAccess', access, this.getAuthHeadersJSON())
  }

  submitRoleReject(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/UserManagement/UpdateRejectAccess', access, this.getAuthHeadersJSON())
  }

  submitApproved(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/UserManagement/PostApproveAccess', access, this.getAuthHeadersJSON())
  }

  submitReject(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/UserManagement/PostRejectAccess', access, this.getAuthHeadersJSON())
  }

  submitReviewed(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/UserManagement/PostReviewedAccess', access, this.getAuthHeadersJSON())
  }

  submitForward(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/UserManagement/PostForwardAccess', access, this.getAuthHeadersJSON())
  }



  postUserManagement(access: accessModel[]) {
    return this.http.post<any>(this.BASEURL + '/Access/PostUserManagement', access, this.getAuthHeadersJSON())

  }

  getAccessList(userUID: string) {
    return this.http.get<Array<accessModel>>(this.BASEURL + '/Access/GetAccess/' + userUID, this.getAuthHeadersJSON());
  }

  submitProductApproved(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/Access/PostApproveAccess', access, this.getAuthHeadersJSON())
  }

  submitProductReject(access: accessModel) {

    return this.http.post<any>(this.BASEURL + '/Access/PostRejectAccess', access, this.getAuthHeadersJSON())
  }

  getMenu(roleId: number | string = 0, userId: number | string = 0) {
    return this.http.get<MenuOptionModel[]>(this.BASEURL + '/Access/GetMenuOptions?roleId=' + roleId + '&userId=' + userId, this.getAuthHeadersJSON());
  }

  getHeaderMenus(userId: number | string = 0) {
    return this.http.get<HeaderMenuItem[]>(this.BASEURL + '/Access/GetUserAccess?userId=' + userId, this.getAuthHeadersJSON());
  }

  getMenuOptionsByParentId(parentId: number | string = 0, userId: number | string = 0) {
    return this.http.get<MenuOptionModel[]>(this.BASEURL + '/Access/GetMenuOptionsForParent?parentMenuId=' + parentId + '&userId='+userId, this.getAuthHeadersJSON());
  }

  setUserAccess(access: SetUserAccessModel[]) {
    return this.http.post<any>(this.BASEURL + '/Access/SetUserAccess', access, this.getAuthHeadersJSON());
  }

  setUserOrganizations(SetUserOrganizationModel: any[]) {    
    return this.http.post<any>(this.BASEURL + '/Access/AddUserOrganization', SetUserOrganizationModel, this.getAuthHeadersJSON());
  }
  
  multipleAPIRequests(request:any){
    return forkJoin(request);
  }

}

