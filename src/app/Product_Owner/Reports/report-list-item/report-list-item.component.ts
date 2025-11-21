import { Component, OnInit } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { ReportType } from 'src/app/enums/enums';
import { CountryModel } from 'src/app/Models/countryModel';
import { RegulationDetailsByCountryIdModel, RegulationSetupDetailsModel } from 'src/app/Models/regulationsetupModel';
import { ReportMaster } from 'src/app/Models/reportModel';
import { ReportService } from 'src/app/Services/report.service';
const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  filter: 'agTextColumnFilter',
  filterParams: {
    buttons: ['reset', 'clear', 'apply'],
    debounceMs: 200,
    suppressAndOrCondition: true,
    caseSensitive: false,
    suppressFilterCondition: true,
    suppressHeaderMenuButton: true,
    suppressHeaderContextMenu: true,
  },
  minWidth: 120
};

@Component({
  selector: 'app-report-list-item',
  templateUrl: './report-list-item.component.html',
  styleUrls: ['./report-list-item.component.scss'],
})
export class ReportListItemComponent implements OnInit {
  defaultColDef = defaultColumnDef;
  columnDefs: ColDef[] | undefined

  countriesDef: ColDef[] = [
    { headerName: 'So No', field: 'countryReferenceCode' },
    { headerName: 'CurrencyId', field: 'currencyId', hide: true },
    { headerName: 'UID', field: 'uid', hide: true },
    { headerName: 'ApprovalUID', field: 'ApprovalUID', hide: true },
    { headerName: 'Country Code', field: 'countryCode', filter: "agSetColumnFilter", flex: 1, minWidth: 150 },
    { headerName: 'Country Name', field: 'countryName', filter: "agSetColumnFilter", flex: 1, minWidth: 150 },
    {
      headerName: 'status',
      field: 'status',
      valueFormatter: (params) =>
        params.value === 1
          ? 'Active'
          : params.value === 0
            ? 'Inactive'
            : params.value,
            flex: 1, minWidth: 150
    },
    { headerName: 'Added Date', field: 'createdOn', valueFormatter: (params) => params.value ? params.value.split('T')[0] : '', flex: 1, minWidth: 150 },
    { headerName: 'InActive Date', field: 'inActiveDate', valueFormatter: (params) => params.value ? params.value.split('T')[0] : '', flex: 1, minWidth: 150 },
    { headerName: 'Currency Code', field: 'currencyCode', flex: 1, minWidth: 150 },
    { headerName: 'Created By', field: 'createdBy', hide: true },
    { headerName: 'Modified By', field: 'modifiedBy', hide: true },
    { headerName: 'Approved By', field: 'approvedBy', flex: 1, minWidth: 150 },
    { headerName: 'Added By', field: 'addedBy', flex: 1, minWidth: 150 },
  ];

  selectedModel: ReportMaster | null = null;
  regColDefs: ColDef[] = [
    { headerName: 'So No', field: 'regulationSetupDetailsReferenceCode' },
    { headerName: 'Country Name', field: 'countryName', filter: "agSetColumnFilter" },
    { headerName: 'State Name', field: 'stateName' },
    { headerName: 'Regulation Name', field: 'regulationName', filter: "agSetColumnFilter" },
    { headerName: 'Regulation Group Name', field: 'regulationGroupName' },
    { headerName: 'Regulation Group Name', field: 'regulationGroupName' },
    {
      headerName: 'status',
      field: 'status',
      valueFormatter: (params) =>
        params.value === 1
          ? 'Active'
          : params.value === 0
            ? 'Inactive'
            : params.value,
    },
    { headerName: 'Created On', field: 'createdOn', valueFormatter: (params) => params.value ? params.value.split('T')[0] : '' },
    { headerName: 'InActive Date', field: 'inActiveDate', valueFormatter: (params) => params.value ? params.value.split('T')[0] : '' },
    { headerName: 'Regulation Effective Date', field: 'regulationEffectiveDate', valueFormatter: (params) => params.value ? params.value.split('T')[0] : '' },

    { headerName: 'Added By', field: 'addedBy' },
    { headerName: 'Approved By', field: 'approvedBy' },

    { headerName: 'Regulation Group Id', field: 'regulationGroupId', hide: true },
    { headerName: 'State Id', field: 'stateId', hide: true },
    { headerName: 'Country Id', field: 'countryId', hide: true },
  ];

  complianceColDefs: ColDef[] = [
    { headerName: 'So No', field: 'complianceCode' },
    { headerName: 'Country Name', field: 'country', filter: "agSetColumnFilter" },
    { headerName: 'Regulation Name', field: 'regulationName', filter: "agSetColumnFilter" },
    { headerName: 'Regulation Group Name', field: 'regulationGroupName' },
    { headerName: 'Parent Compliance Code', field: 'parentComplaincecode' },
    { headerName: 'Parent Compliance Name', field: 'parentComplianceName' },
    { headerName: 'Compliance Name', field: 'complianceName' },
    { headerName: 'Compliance Section', field: 'complianceSection' },
    { headerName: 'Compliance Type', field: 'compliancetype' },
    {
      headerName: 'status',
      field: 'compliancestatus',
      valueFormatter: (params) =>
        params.value === 1
          ? 'Active'
          : params.value === 0
            ? 'Inactive'
            : params.value,
    },
    { headerName: 'Created On', field: 'createdOn', valueFormatter: (params) => params.value ? params.value.split('T')[0] : '' },
    { headerName: 'InActive Date', field: 'complianceInactiveDate', valueFormatter: (params) => params.value ? params.value.split('T')[0] : '' },
    { headerName: 'Compliance Effective Date', field: 'complianceEffectiveDate', valueFormatter: (params) => params.value ? params.value.split('T')[0] : '' },
    { headerName: 'Applicable Parameter', field: 'applicableByParameter' },
    { headerName: 'Parameter Value', field: 'parametervalue' },
    { headerName: 'Added By', field: 'addedBy' },
    { headerName: 'Approved By', field: 'approvedBy' }
  ];

   entityColDefs: ColDef[] = [
    { headerName: 'So No', field: 'entityTypeReferenceCode' },
    { headerName: 'Country Name', field: 'countryName', filter: "agSetColumnFilter" },
    {
      headerName: 'status',
      field: 'statusId',
      valueFormatter: (params) =>
        params.value === 1
          ? 'Active'
          : params.value === 0
            ? 'Inactive'
            : params.value,
    },
    { headerName: 'Country Code', field: 'countryCode', filter: "agSetColumnFilter" },
     { headerName: 'EntityType Name', field: 'entityTypeName', filter: "agSetColumnFilter" },
    { headerName: 'Created On', field: 'createdOn', valueFormatter: (params) => params.value ? params.value.split('T')[0] : '' },
    { headerName: 'InActive Date', field: 'complianceInactiveDate', valueFormatter: (params) => params.value ? params.value.split('T')[0] : '' },
    { headerName: 'Added By', field: 'createdByName' },
    { headerName: 'Approved By', field: 'approvedBy'  }
  ];
 industryColDefs: ColDef[] = [
    { headerName: 'So No', field: 'majorIndustryReferenceCode' },
    { headerName: 'Country Name', field: 'countryName', filter: "agSetColumnFilter" },
    {
      headerName: 'status',
      field: 'status',
      valueFormatter: (params) =>
        params.value === 1
          ? 'Active'
          : params.value === 0
            ? 'Inactive'
            : params.value,
    },
     { headerName: 'Major Industry Name', field: 'majorIndustryName', filter: "agSetColumnFilter" },
     { headerName: 'Minor Industry Name', field: 'minorIndustryName', filter: "agSetColumnFilter" },
     { headerName: 'Major Industry Code', field: 'majorIndustryCode', filter: "agSetColumnFilter" },
     { headerName: 'Minor Industry Code', field: 'minorIndustryCode', filter: "agSetColumnFilter" },
    { headerName: 'Created On', field: 'createdOn', valueFormatter: (params) => params.value ? params.value.split('T')[0] : '' },
    { headerName: 'InActive Date', field: 'complianceInactiveDate', valueFormatter: (params) => params.value ? params.value.split('T')[0] : '' },
    { headerName: 'Added By', field: 'createdByName' },
    { headerName: 'Approved By', field: 'approvedByName' }
  ];
  countriesList: any[] = [];
  reportMasterList: ReportMaster[] = [];
  regulationWithCountriesList: RegulationDetailsByCountryIdModel[] = [];
  constructor(private reportService: ReportService) { }

  ngOnInit(): void {
    this.columnDefs = this.countriesDef;
    this.getAllCountries();
    this.getAllReportMaster();
  }

  onGridReady(params: any) {
    params.api.sizeColumnsToFit();
  }
  async getAllCountries(): Promise<void> {
    try {
      const result = await this.reportService.getAllCountries().toPromise();
      this.countriesList = result ?? [];
    } catch {
      console.error('Error fetching countries');
    }
  }
   async getAllEntityType(): Promise<void> {
    try {
      const result = await this.reportService.getAllEntityType().toPromise();
      this.countriesList = result ?? [];
    } catch {
      console.error('Error fetching countries');
    }
  }
  async getAllIndustryCountry(): Promise<void> {
    try {
      const result = await this.reportService.getAllIndustryCountry().toPromise();
      this.countriesList = result ?? [];
    } catch {
      console.error('Error fetching countries');
    }
  }
  async getAllReportMaster(): Promise<void> {
    try {
      const result = await this.reportService.getAllReportMaster().toPromise();
      this.reportMasterList = result ?? [];
    } catch {
      console.error('Error fetching report master');
    }
  }
  async getAllRegulationWithCountries(): Promise<void> {
    try {
      const result = await this.reportService.getAllRegulationWithCountries().toPromise();
      this.countriesList = result ?? [];
    } catch {
      console.error('Error fetching regulations with countries');
    }
  }
  async getAllComplianceWithCountries(): Promise<void> {
    try {
      const result = await this.reportService.getAllComplianceWithCountries().toPromise();
      this.countriesList = result ?? [];
    }
    catch {
      console.error('Error fetching compliance with countries');
    }

  }
  onChangeReports(event: any): void {
    const selectedReportId = event.target.value;
    if (ReportType.P6 === selectedReportId) {
      this.columnDefs = this.regColDefs;
      this.getAllRegulationWithCountries();
    }
    if (ReportType.P1 === selectedReportId) {
      this.columnDefs = this.countriesDef;
      this.getAllCountries();
    }
    if (ReportType.P7 === selectedReportId) {
      this.columnDefs = this.complianceColDefs;
      this.getAllComplianceWithCountries();
    }
    if(ReportType.P3===selectedReportId){
      this.columnDefs = this.entityColDefs;
      this.getAllEntityType();
    }
    if(ReportType.P2===selectedReportId){
      this.columnDefs = this.industryColDefs;
      this.getAllIndustryCountry();
    }

  }
}
