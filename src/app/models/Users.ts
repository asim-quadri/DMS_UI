import { ResponseModel } from "./responseModel"

export interface UsersModel extends ResponseModel {
  historyId?: number | null
  id?: number | null
  empId?: string
  firstName?: string
  lastName?: string
  fullName?: any
  email?: string
  mobile?: string
  password?: any
  status?: number
  startDate?: string
  endDate?: string | null
  managerId?: number
  managerName?: string
  createdOn?: string
  createdBy?: number
  modifiedOn?: any
  modifiedBy?: any
  uid?: string | null
  roleDisplayName?: string
  roleName?: string
  roleId?: number
  approvalManagerId?: number

}

export interface loginModel {
  userId?: string
  password?: string
  email?: string
}