export interface ReportMaster {
    id?: number;
    reportSequence: string;
    reportDescription: string;
    isActive: boolean;
}

export interface regulationComplianceWithCountryModel {
  country: string;
  regulationCode?: string;
  regulationName: string;
  regulationGroupName: string;
  parentComplaincecode?: string;
  parentComplianceName: string;
  complianceCode?: string;
  complianceName?: string;
  complianceSection?: string;
  compliancetype?: string;
  compliancestatus: string;
    createdOn?: Date;
  complianceEffectiveDate?: Date;
  complianceInactiveDate?: string;
  applicableByParameter?: string;
  parametervalue?: string;
  approvedBy?: string;
  addedBy?: string;
}

