import { Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { LevelMaster, ServiceRequest, ServiceRequestSortBy, SortDirection } from './ServiceRequest';
import { ServiceRequestService } from 'src/app/Services/service-request.service';
import { firstValueFrom } from 'rxjs';
import { ColDef, GridApi } from 'ag-grid-community';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { id, ro, th } from 'date-fns/locale';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NotifierNotificationComponent, NotifierService } from 'angular-notifier';
import { DatePipe } from '@angular/common';
import { any } from 'underscore';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { MenuOptionModel } from 'src/app/Models/Users';

const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
};

@Component({
  selector: 'app-service-request',
  templateUrl: './service-request.component.html',
  styleUrls: ['./service-request.component.scss'],
  providers: [DatePipe]
})



export class ServiceRequestComponent implements OnInit {

  @ViewChild('ActionRequest') actionRequest!: TemplateRef<any>;
  serviceRequestData: ServiceRequest[] = [];
  defaultColDef = defaultColumnDef;
  serviceRequestUpdate: FormGroup;
  private api: GridApi | undefined;
  minDate: any;
  levelMasterOptions: LevelMaster[] = [];
  userInformation: any | null = null;
  selectedValue: number = 1;
  showServiceRequestDataTable: boolean = false;
  showUpdateServiceRequest: boolean = false;
  serviceRequestSortBy: { filterId: number; filterRequestName: string }[] = [];
  columnDefs: ColDef[] = [
    { headerName: 'Id', field: 'id', hide: true },
    { headerName: 'MajorModuleId', field: 'majorModuleId', hide: true },
    { headerName: 'MinorModuleId', field: 'minorModuleId', hide: true },
    { headerName: 'Level Id', field: 'levelId', hide: true },
    { headerName: 'Level Name', field: 'levelName', hide: true },
    { headerName: 'Entity Id', field: 'entityId', hide: true },
    { headerName: 'User Id', field: 'userId', hide: true },
    { headerName: 'Organization Id', field: 'organizationId', hide: true },
    { headerName: 'Created By', field: 'createdBy', hide: true },
    { headerName: 'Modified By', field: 'modifiedBy', hide: true },
    {
      headerName: 'Subject', field: 'subject', cellStyle: {
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap',
        'overflow': 'hidden',
        'padding': '1'
      }
    },
    {
      headerName: 'Description', field: 'description', cellStyle: {
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap',
        'overflow': 'hidden',
        'padding': '1'
      }
    },

    { headerName: 'Modified On', field: 'modifiedOn', hide: true },
    { headerName: 'Entity Name', field: 'entityName' },
    {
      headerName: 'Organization Name', field: 'organizationName', cellStyle: {
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap',
        'overflow': 'hidden',
        'padding': '1'
      }
    },
    {
      headerName: 'Minor Module Name', field: 'minorModuleName', cellStyle: {
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap',
        'overflow': 'hidden',
        'padding': '1'
      }
    },
    {
      headerName: 'Major Module Name', field: 'majorModuleName', cellStyle: {
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap',
        'overflow': 'hidden',
        'padding': '1'
      }
    },
    { headerName: 'Level Type', field: 'levelType' },
    {
      headerName: 'Expected Date',
      field: 'expectedDate',
      valueFormatter: params => params.value ? this.formatDate(params.value) : '',
    }, { headerName: 'Comments', field: 'comments' },
  ];

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  }
  constructor(public requestService: ServiceRequestService, private persistance: PersistenceService,
    private modalService: NgbModal, private fb: FormBuilder, private notifyService: NotifierService, private datePipe: DatePipe) {
    this.serviceRequestUpdate = this.fb.group({
      id: [0],
      historyId: [0],
      majorModuleId: [0],
      minorModuleId: [0],
      levelMasterId: [0],
      entityId: [0],
      userId: [0],
      organizationId: [0],
      subject: [''],
      description: [''],
      managerId: [0],
      status: [0],
      createdOn: [''],
      majorModuleName: [''],
      minorModuleName: [''],
      uid: [null],
      organizationName: [''],
      entityName: [''],
      createdBy: [null],
      expectedDate: [null],
      modifiedOn: new Date(),
      filterId: [1],
      modifiedBy: [null],
      comments: ['']
    });
  }


  ngOnInit() {
    var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 3
      var menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 6);
      console.log('Org setup Menu Options:', menuOptions);
      if (menuOptions.length > 0) {
        this.showServiceRequestDataTable = menuOptions.filter((option: MenuOptionModel) => option.title === 'View' && option.canView).length > 0;
        this.showUpdateServiceRequest = menuOptions.filter((option: MenuOptionModel) => option.title === 'Update' && option.canView).length > 0;
        // if (this.showAddNewEntityButton || this.showAddNewBillingButton) {
        //     this.showContextMenu = false;
        // }
      }
    }
    this.getAllServiceRequests(this.selectedValue);
    this.minDate = new Date().toISOString().split('T')[0];
    this.getuserInfo();
    this.getStortingOptions();

  }

  openXl(content: any | TemplateRef<any>) {

    this.modalService.open(content, { size: 'xl', centered: true });

  }


  getStortingOptions() {
    try {
      this.serviceRequestSortBy = Object.keys(ServiceRequestSortBy)
        .filter(key => isNaN(Number(key)))
        .map(key => ({
          filterId: ServiceRequestSortBy[key as keyof typeof ServiceRequestSortBy],
          filterRequestName: key
        }));
    }
    catch (error) {
      console.error('Error fetching sorting options:', error);
      this.notifyService.notify('error', 'Failed to fetch sorting options');
    }
  }
  onGridReady(params: any): void {
    this.api = params.api;
  }

  onRowClicked(event: any): void {

    this.serviceRequestUpdate.patchValue({
      id: event.data.id,
      historyId: event.data.historyId,
      majorModuleId: event.data.majorModuleId,
      minorModuleId: event.data.minorModuleId,
      levelMasterId: event.data.levelMasterId,
      entityId: event.data.entityId,
      userId: event.data.userId,
      organizationId: event.data.organizationId,
      subject: event.data.subject,
      description: event.data.description,
      managerId: event.data.managerId,
      status: event.data.status,
      createdOn: event.data.createdOn,
      levelType: event.data.levelType,
      majorModuleName: event.data.majorModuleName,
      minorModuleName: event.data.minorModuleName,
      uid: event.data.uid,
      organizationName: event.data.organizationName,
      entityName: event.data.entityName,
      createdBy: event.data.createdBy,
      expectedDate: this.datePipe.transform(event.data.expectedDate, 'yyyy-MM-dd') || null,
      comments: event.data.comments || ''
    });

    this.getAllLevel();
    this.showUpdateServiceRequest && this.openXl(this.actionRequest);
  }
  getAllUserInformation() {

  }
  getuserInfo() {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) return null;
    try {
      const user = JSON.parse(userData);
      this.userInformation = user;
      return typeof user?.id === 'number' ? user.id : Number(user?.id) || null;
    } catch {
      return null;
    }
  }
  async setExpectedDateAsync(serviceRequest: ServiceRequest): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.requestService.setExpectedDateAsync(serviceRequest)
      );
      if (response && response.success) {
        this.notifyService.notify('success', response.message || 'Expected date updated successfully');
      } else {
        const errorMsg = response && response.message ? response.message : 'Failed to update expected date';
        this.notifyService.notify('error', errorMsg);
      }
    } catch (error) {
      console.error('Error updating expected date:', error);
    }
  }
  async getAllServiceRequests(sortBy: number) {
    try {
      const data = await firstValueFrom(
        this.requestService.getAllServiceRequests(
          sortBy
        )
      );
      this.serviceRequestData = Array.isArray(data) ? data : data ? [data] : [];
    } catch (error) {
      console.error('Error fetching service requests:', error);
    }
  }

  async getAllLevel() {
    try {
      const data = await firstValueFrom(this.requestService.getAllLevel());
      this.levelMasterOptions = Array.isArray(data) ? data : data ? [data] : [];
    } catch (error) {
    }
  }

  updateServiceRequest() {
    const serviceRequest: ServiceRequest = this.serviceRequestUpdate.value;
    serviceRequest.modifiedBy = this.userInformation?.id || 0;
    this.setExpectedDateAsync(serviceRequest).then(() => {
      this.modalService.dismissAll();
      this.serviceRequestUpdate.reset();
      this.getAllServiceRequests(this.selectedValue);
    }).catch(error => {
      console.error('Error updating service request:', error);
    });
  }
  onSortByChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValue = parseInt(selectElement.value, 10);

    if (!isNaN(selectedValue)) {
      this.fetchSortedServiceRequests(selectedValue);
    }
  }

  // Call your backend API
  fetchSortedServiceRequests(sortBy: number): void {
    this.requestService.getSortedData(sortBy).subscribe({
      next: (response: ServiceRequest[]) => {
        this.serviceRequestData = response;
      },
      error: (err: any) => {
        console.error("Failed to fetch service requests", err);
      }
    });
  }


}

