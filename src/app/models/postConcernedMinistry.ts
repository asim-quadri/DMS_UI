
export interface postConcernedMinistry
{
    id?: number;
    concernedMinistryCode: string;
    concernedMinistryName: string;
    concernedMinistryReferenceCode?: string;
    managerId: number;
    createdBy: number;
    createdOn?: Date;
    status: number;
    modifiedBy?: number;
    modifiedOn?: Date;
    uid?: string;
    userName?: string;
    managerName?: string;
    approveStatus?: string;
}


export interface ConcernedMinistry {
    id?: number;
    concernedMinistryCode: string;
    concernedMinistryName: string;
    concernedMinistryReferenceCode?: string;
    createdBy: number;
    createdOn?: Date;
    status: number;
    modifiedBy?: string;
    modifiedOn?: Date;
    uid?: string;
}
export interface CountryConcernedMinistryMapping {
    id?: number;
    countryId: number;
    concernedMinistryId: number;
    status?: number;
    createdOn: Date;
    managerId?: number;
    createdBy: number;
    modifiedOn?: Date;
    modifiedBy?: number;
    uid?: string;
    countryConcernedMinistryReferenceCode?: string;
    userName?: string;
    approveStatus?: string;
    managerName?: string;
    countryName?: string;
    concernedMinistryName?: string;
    hide?: boolean;
}