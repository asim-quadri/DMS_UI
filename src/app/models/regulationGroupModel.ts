import { ResponseModel } from "./responseModel";

export interface RegulationGroupModel extends ResponseModel {
    id: number;
    regulationGroupId: number ;
    countryId: number;
    countryName: string | null;
    managerId: number;
    regulationGroupName: string | null;
    regulationGroupCode: string | null;
    countryRegulationGroupMappingId: number;
    approvalStatus: string | null;
    createdOn: string | null;
    createdBy: number ;
    modifiedBy: number ;
    modifiedOn: string | null;
    uid: string | null;
    forward: string | null;
    hide:boolean | false;
}