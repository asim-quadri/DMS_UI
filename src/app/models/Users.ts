import { Genders } from '../enums/enums';
import { ResponseModel } from './responseModel';

export interface UsersModel extends ResponseModel {
  historyId?: number | null;
  id?: number | null;
  empId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: any;
  email?: string;
  mobile?: string;
  password?: any;
  status?: number;
  startDate?: string;
  endDate?: string | null;
  managerId?: number;
  managerName?: string;
  createdOn?: string;
  createdBy?: number;
  modifiedOn?: any;
  modifiedBy?: any;
  uid?: string | null;
  roleDisplayName?: string;
  roleName?: string;
  roleId?: number;
  approvalManagerId?: number;
  organizationId?: number;
  dateOfBirth?: string | null;
  gender?: Genders;
}

export interface loginModel {
  userId?: string;
  password?: string;
  email?: string;
  mobileNo?: string;
}

export interface MenuOptionModel extends ResponseModel {
  id: number;
  title: string;
  icon?: string;
  route?: string;
  parentId?: number;
  sortOrder?: number;
  menuId: number;
  canView?: boolean;
}
