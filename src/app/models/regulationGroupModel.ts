import { ResponseModel } from "./responseModel";

export interface RegulationGroupModel extends ResponseModel {
    id: number;
    regulationGroupId: number;
    countryId: number;
    countryName: string | null;
    managerId: number;
    regulationGroupName: string | null;
    regulationGroupCode: string | null;
    countryRegulationGroupMappingId: number;
    approvalStatus: string | null;
    createdOn: string | null;
    createdBy: number;
    modifiedBy: number;
    modifiedOn: string | null;
    uid: string | null;
    forward: string | null;
    hide: boolean | false;
    regulationGroupReferenceCode?: string | null;
}

export interface ComplianceTypeRegulationSetupModel {
    id: number;
    regulationSetupId: number;
    complianceId: number;
    typeOfComplianceName: string;
}

export interface PostRegulationGroupModel {
    userId: number,
    countryIds: string,
    stateIds: string,
    regulationIds: string,
    regulationGroupId: string,
    complianceType: string,
    complianceId: string
}