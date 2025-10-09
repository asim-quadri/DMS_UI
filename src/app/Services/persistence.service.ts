import { Injectable } from '@angular/core';
import { UsersModel } from '../models/Users';
import { json } from '@rxweb/reactive-form-validators';
import { Router } from '@angular/router';
import { RolesModels } from '../models/roles';

@Injectable({
  providedIn: 'root',
})
export class PersistenceService {
  user: UsersModel = {};
  role: RolesModels = {};

  constructor(private router: Router) {
    var userobje = sessionStorage.getItem('currentUser')!;
    if (userobje) {
      this.user = JSON.parse(userobje);
    }
  }

  // setLocalStorage(key: string, data: any): void {
  //   localStorage.setItem(key, JSON.stringify(data))
  // }

  // removelocalStorage(Key: string){
  //   localStorage.removeItem(Key);
  // }

  // getLocalStorage(key: string){

  // }

  setSessionStorage(key: string, data: any): void {
    sessionStorage.setItem(key, JSON.stringify(data));
  }

  removeSessionStorage(key: string) {
    sessionStorage.removeItem(key);
  }

  getSessionStorage(Key: string) {
    return JSON.parse(sessionStorage.getItem(Key) || '{}');
  }

  getByUserId(UserId: string) {
    return JSON.parse(sessionStorage.getItem(UserId) || '{}');
  }

  getUserUID() {
    return this.user!.uid ? this.user!.uid : null;
  }

  getRoleUID() {
    return this.role!.uid ? this.role!.uid : null;
  }

  getUserId() {
    return this.user.id;
  }

  getManagerId() {
    return this.user.managerId;
  }

  getUserName() {
    return this.user.fullName;
  }

  getRoleId(){
    return this.user.roleId;
  }

  getRole() {
    return this.user.roleName;
  }

  isUser(){
    return this.user.roleName == 'User' ? true : false;
  }

  set isSuperAdmin(value: boolean) {
    sessionStorage.setItem('isSuperAdmin', JSON.stringify(value));
  }

  get isSuperAdmin() {
    const res = sessionStorage.getItem('isSuperAdmin') as any;
    return Boolean(JSON.parse(res));
  }


  logout() {
    sessionStorage.clear();
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }
}
