export interface SetUserCountriesModel {
  userId: number;
  countryId: number;
  hasAccess: boolean;
}

export interface UserStateMappingModel {
  userId: number;
  stateId: number;
  hasAccess: boolean;
}

export interface UserStateMappingResponse{
  userId: number;
  stateId: number;
  countryId: number| string;
  stateName: string;
  hasAccess: boolean;
}