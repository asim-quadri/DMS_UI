export class RolesModels {
    roleId?: number
    id?:number | null;
    roleName?: string;
    roleDisplayName?: string;
    pointofContact?:String;
    description?: string;
    status?: number;
    createdOn?: string;
    createdBy?: string;
    modifiedOn?: any;
    modifiedBy?: any;
    uid?: string | null;
    responseCode?: number
    responseMessage?: any
    ResultSet?: any
}

export class UpdateRoleModels {
    roleDisplayName: string ='';
    createdBy?: string;
    managerId?:number;
}


