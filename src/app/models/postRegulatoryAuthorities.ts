export interface PostRegulatoryAuthorities {
    id?: number;
    regulatoryAuthorityCode?: string;
    regulatoryAuthorityName: string;
    regulatoryAuthorityReferenceCode?: string;
    createdBy: number;
    CreatedOn: Date; 
    ModifiedBy?: number;
    ModifiedOn?: string; 
    uid?: string;
    managerId: number;
    status:number;
    managerName?:string;
    userName?:string;
    approveStatus?:string;  
}
export interface RegulatoryAuthorities {
    id?: number;
    regulatoryAuthorityCode?: string;
    regulatoryAuthorityName: string;
    regulatoryAuthorityReferenceCode?: string;
    createdBy: number;
    createdOn: Date;
    status: number;
    modifiedBy?: string;
    modifiedOn?: Date;
    uid?: string;
}

export interface CountryRegulatoryAuthorityMapping {
    id?: number;
    countryId: number;
    regulatoryAuthorityId: number;
    status?: number;
    createdOn: Date;
    managerId?: number;
    createdBy: number;
    modifiedOn?: Date;
    modifiedBy?: number;
    uid: string;
    countryRegAuthReferenceCode?: string;
    userName?: string;
    approveStatus?: string;
    managerName?: string;
    regAuthName?: string;
    countryName?: string;
    hide?: boolean;
}
