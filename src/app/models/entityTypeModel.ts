import { ResponseModel } from "./responseModel";
export interface EntityTypeModel extends ResponseModel {
    id?: number;
    entityTypeId?: number;
    countryId?: number;
    countryCode?: string | null;
    countryName?: string | null;
    managerId?: number;
    entityType?: string | null;
    entityTypeCode?: string | null;
    entityTypeName?: string | null;
    countryEntityTypeMappingId?: number;
    approvalStatus?: string | null;
    fullName?: string | null;
    statusId?: number;
    createdOn?: Date | null;
    createdBy?: number;
    modifiedBy?: number;
    modifiedOn?: Date | null;
    uid?: string | null;
    hide:boolean | false;
    entityTypeReferenceCode?: string | null;
    createdByName ?: string | null;
    approvedBy ?: string | null;
    
}