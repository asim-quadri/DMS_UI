export class AnnoucementModel {
    id?: number;
    regulationId?: number;
    regulationName?: string;
    complianceId?: number; 
    tOCId?: number;
    tocId?: number;
    createdDate?: string ;
    createdByName?: string ;
    createdBy?: number;
    applicableDate?: Date;
    description?: string;
    subject!: string;
    approvalManagerId?: number;
    hide?:boolean;
      announcementReferencecode?:string | null;
      expanded?:boolean;
      visible?:boolean=true;
}
