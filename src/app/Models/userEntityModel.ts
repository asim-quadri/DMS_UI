import { ResponseModel } from "./responseModel";

export interface UserEntityModel extends ResponseModel {
    id?: number;
    entityName: string;
}

export interface LocationEntityModel extends ResponseModel {
    id?: number;
    locationName: string;
}
export interface EntitiesCityCoordinate extends ResponseModel {
    id: number;
    entityName: string;
    organizationId?: number;
    organizationName: string;
    majorIndustryId?: number;
    minorIndustryId?: number;
    majorIndustry: string;
    minorIndustry: string;
    majorIndustryName: string;
    minorIndustryName: string;
    countryId: string;
    countryName: string;
    stateId?: number;
    stateName: string;
    city: string;
    address: string;
    pin: string;
    status?: number;
    createdOn?: Date;
    createdBy?: number;
    modifiedOn?: Date;
    modifiedBy?: number;
    uid?: string; // Guid as string
    managerId?: number;
    entityTypeId?: number;
    entityType: string;
    customerId: string;
    pointOfContact: string;
    approvedby: string;
    financialYearStart: string;
    financialYearEnd: string;
    toMonth: string;
    fromMonth: string;
    latitude: number;
    longitude: number;
}

export interface clientEntitesLocation {
    id: number,
    entityName: string,
    organizationId: number,
    organizationName: string,
    countryId: string,
    countryName: string,
    stateId: number,
    stateName: string,
    city: string,
    address: string,
    pin: string,
    latitude: number,
    longitude: number,
    billingDetailsMaxColorCode: number,
    billingDetailsMaxColorName: string,
    serviceRequestMaxColorCode: number,
    serviceRequestMaxColorName: string,
    status?: number;
    maxBillingStatusEntry?: [string, number];
    maxServiceStatusEntry?: [string, number];
}