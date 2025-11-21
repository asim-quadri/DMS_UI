export interface ServiceRequest {
    id: number;
    majorModuleId: number;
    minorModuleId: number;
    levelMasterId: number;
    entityId: number;
    userId: number;
    organizationId: number;
    subject: string;
    description: string;
    status?: number;
    createdOn: Date;
    createdBy?: number;
    isActive: boolean;
    expectedDate?: Date;
    modifiedOn?: Date;
    modifiedBy?: number;
    entityName?: string;
    organizationName?: string;
    userName?: string;
    approvedStatus?:string;
    minorModuleName?: string;
    majorModuleName?: string;
    levelType?: string;
    comments?:string;
}

export interface LevelMaster {
    id: number;
    levelType: string;
    isActive: boolean;
}
 export enum ServiceRequestSortBy
 {
  Recent = 1,
  Oldest,
  Red,
  Amber,
  Green,
  Subject,
  Description,
  ExpectedDate
 }
 export enum SortDirection
 {
     asc=1,
     desc=2
 }

export interface BaseResult {
    success: boolean;
    message: string;
}

export interface Result<T> extends BaseResult {
    data: T | null;
}