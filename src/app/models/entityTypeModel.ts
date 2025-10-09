import { ResponseModel } from "./responseModel";
export interface EntityTypeModel extends ResponseModel {
    id?: number;
    entityTypeId?: number;
    countryId?: number;
    countryName?: string | null;
    managerId?: number;
    entityType?: string | null;
    entityTypeCode?: string | null;
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
}