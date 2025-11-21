import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  EventEmitter,
  Output,
  Input,
  TemplateRef,
  Optional,
} from '@angular/core';
//import { ElementRef, HostListener } from '@angular/core';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import {
  NgbModal,
  ModalDismissReasons,
  NgbModalRef,
  NgbActiveModal,
} from '@ng-bootstrap/ng-bootstrap';
import { OrganizationService } from 'src/app/Services/organization.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { ApiService } from 'src/app/Services/api.service';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { accessModel, pendingApproval } from 'src/app/Models/pendingapproval';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { Constant } from 'src/app/@core/utils/constant';
import {
  OrganizationDetail,
  OrganizationEntityList,
} from 'src/app/Models/organizationModel';
import { CountryService } from 'src/app/Services/country.service';
import {
  CountryModel,
  CountryStateMapping,
  StatesModel,
} from 'src/app/Models/countryModel';
import { password, RxwebValidators } from '@rxweb/reactive-form-validators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BillingLevelModel } from 'src/app/Models/billingLevelModel';
import { ProductTypeModel } from 'src/app/Models/productTypeModel';
import {
  IndustryMapping,
  MajorIndustryModel,
  MinorIndustrypModel,
} from 'src/app/Models/industrysetupModel';
import { EntityTypeModel } from 'src/app/Models/entityTypeModel';
import { IndustryService } from 'src/app/Services/industry.service';
import { EntityTypeService } from 'src/app/Services/entityType.service';
import { Router } from '@angular/router';
import { EntityService } from 'src/app/Services/entity.service';
import { EntityModel } from 'src/app/Models/entityModel';
import { BillingDetailsService } from 'src/app/Services/billing-details.service';
import { BillingDetailsModel } from 'src/app/Models/billingDetailsModel';
import { organization } from '../organization-details/organization';


const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
  pagination: true,
};
@Component({
  selector: 'app-organization-approval',
  templateUrl: './organization-approval.component.html',
  styleUrls: ['./organization-approval.component.scss'],
  providers: [organization],
})
export class OrganizationApprovalComponent implements OnInit {
  @ViewChild('organizationapproval') organizationapproval: any;
  @ViewChild('entityapproval') entityapproval: any;
  @ViewChild('billingapproval') billingapproval: any;
  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();
  approvedCount: number = 0;
  rejectedCount: number = 0;
  pendingCount: number = 0;
  rowData: any[] = [];
  defaultColumnDef = defaultColumnDef;
  organizationName: OrganizationDetail[] = [];
  organizationNameWithoutStatus: OrganizationDetail[] = [];
  selectedCountries: string[] = [];
  countryStateMapping: CountryStateMapping[] = [];
  billingLevel: BillingLevelModel[] = [];
  typeOfProduct: ProductTypeModel[] = [];
  approvalForm: FormGroup;
  selectedOrganizationNameTop: string = '';
  selectedRowData: any = {};
  currentUserUID: string | null = '';

  entityStatus: string = '';
  entityDetails: any = {};
  billingDetails: any = {};
  selectedMinorIndustryList: MinorIndustrypModel[] = [];
  selectedMajorIndustryList: MajorIndustryModel[] = [];
  selectedStateList: any[] = [];
  countryEntityTypeMapping: EntityTypeModel[] = [];

  selectedEntityList: EntityTypeModel[] = [];
  industryMapping: IndustryMapping[] = [];
  stateList = [];
  organizationList: any;
  organizationEntityList: OrganizationEntityList[] = [];
  userId: number | null = 1;

  @Input()
  modal: any;

  countries: CountryModel[] = [];

  public addMapping = {
    countryDD: {
      singleSelection: false, // Set to false for multiple selection
      idField: 'id',
      textField: 'countryName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      data: [] as any,
      countries: [] as CountryModel[],
    },
    isLoaded: true,
    isSubmit: false,
  };
  public rowSelection: 'single' | 'multiple' = 'multiple';

  private gridApi: GridApi | undefined;
  columnDefs: ColDef[] = [
    {
      headerName: '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 50,
    },
    { headerName: 'organizationId', field: 'organizationId', hide: true },
    { headerName: 'entityId', field: 'entityId', hide: true },
    { headerName: 'billingDetailsId', field: 'billingDetailsId', hide: true },
    { headerName: 'S.No', valueGetter: 'node.rowIndex + 1', width: 80 },
    { headerName: 'Type', field: 'type', width: 150 },
    { headerName: 'Name', field: 'name', width: 150 },
    { headerName: 'Customer ID', field: 'customerId', width: 100 },
    { headerName: 'Point of Contact', field: 'pointOfContact', width: 150 },
    { headerName: 'Approver', field: 'approvedby', width: 150 },
    { headerName: 'Onboarding Stage', field: 'onboardingStage', width: 150 },
    { headerName: 'Status', field: 'status', width: 100 },
  ];
  private currentModalRef?: NgbModalRef;
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private organizationService: OrganizationService,
    private persistance: PersistenceService,
    public countryService: CountryService,
    private billingService: BillingDetailsService,
    private entityService: EntityService,
    private modalService: NgbModal,
    public entityTypeService: EntityTypeService,
    public industryService: IndustryService,
    @Optional() public activeModel: NgbActiveModal
  ) {
    this.approvalForm = this.fb.group({
      organizationName: [{ value: '', disabled: true }, Validators.required],
      entity: ['', Validators.required],
      countryId: [null, Validators.required],
      countryDDId: [null, Validators.required],
      stateId: [null, Validators.required],
      city: ['', Validators.required],
      entityType: [null, Validators.required],
      majorIndustry: [null, Validators.required],
      minorIndustry: [null, Validators.required],
      address: ['', Validators.required],
      pin: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      typeOfProduct: [null, Validators.required],
      numberOfEntities: ['', Validators.required],
      numberOfUsers: ['', Validators.required],
      billingLevel: [null, Validators.required],
      fullName: [null, Validators.required],
      emailID: [null, Validators.required],
      designation: [null, Validators.required],
      password: [null, Validators.required],
    });

    this.approvalForm.disable();
  }

  formgroup: FormGroup = this.fb.group({
    organizationName: [
      '',
      [RxwebValidators.required({ message: 'Select Organization name' })],
    ],
  });

  ngOnInit(): void {
    this.currentUserUID = this.persistance.getUserUID();
    this.getOrganizations();
    this.getOrgEntityList();
    this.getOrganizationApproval();
    this.formgroup.get('organizationName')?.valueChanges.subscribe((value) => {
      this.onOrganizationSelect(value);
    });
    // Initialization logic can go here
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.getOrganizations();
    this.getOrganizationWithoutStatus();
    this.getCountries();
    this.getCountrStateMapping();
    this.getAllBillingLevel();
    this.getAllProductType();

    this.approvalForm
      .get('organizationName')
      ?.valueChanges.subscribe((value) => {
        this.onRowClicked(value);
      });

    this.organizationService
      .getSelectedOrganization()
      .subscribe((organization) => {
        if (organization) {
          this.organizationList = organization;
          this.getStateById(organization.countryDDId);
          this.bindFormDatas();
          this.loadData(organization);
        }
      });
  }
  openXl(content: any | TemplateRef<any>) {
    if (content instanceof TemplateRef) {
      this.currentModalRef = this.modalService.open(content, { size: 'xl' });
    } else {
      this.modalService.open(content, { size: 'xl', centered: true });
    }
  }
  getOrganizations(): void {
    //let user = null;

    //var managerId =  this.persistance.getManagerId();
    //if(managerId != null && managerId != 0){
    //}
    // this.organizationService.getOrganizations(user).subscribe((result: any) => {
    //   this.organizationName = result;
    //   console.log("this.organizationName", this.organizationName);
    //   //this.addMapping.countryDD.data = result;  // Update the data for the dropdown
    // });

    this.organizationService.getOrganizations().subscribe((result: any) => {
      this.organizationName = result.map((organization: any) => {
        return {
          ...organization,
          isOrganization: organization.billingLevelId === 1,
          isBilling: organization.billingLevelId === 2,
          OrganizationName: organization.organizationName,
          CreatedBy: organization.createdBy,
          fullName: organization.fullName,
          status: organization.status,
          organizationId: organization.organizationId,
          type: organization.type,
          country: organization.country,
        };
      });
      console.log('this.organizationName', this.organizationName);
      // this.addMapping.countryDD.data = result;  // Update the data for the dropdown
    });
  }

  getOrganizationWithoutStatus(): void {
    //let user = null;
    var currentUser = this.persistance.getUserId();
    //var managerId =  this.persistance.getManagerId();
    //if(managerId != null && managerId != 0){
    const user = currentUser;
    //}
    // this.organizationService.getOrganizations(user).subscribe((result: any) => {
    //   this.organizationName = result;
    //   console.log("this.organizationName", this.organizationName);
    //   //this.addMapping.countryDD.data = result;  // Update the data for the dropdown
    // });

    this.organizationService
      .getOrganizationWithoutStatus(user)
      .subscribe((result: any) => {
        this.organizationNameWithoutStatus = result.map((organization: any) => {
          return {
            ...organization,
            isOrganization: organization.billingLevelId === 1,
            isBilling: organization.billingLevelId === 2,
            OrganizationName: organization.organizationName,
            CreatedBy: organization.createdBy,
            fullName: organization.fullName,
            stateId: organization.stateId,
            status: organization.status,
            organizationId: organization.organizationId,
            type: organization.type,
            country: organization.country,
          };
        });
        console.log(
          'this.organizationNameWithoutStatus',
          this.organizationNameWithoutStatus
        );
        //this.addMapping.countryDD.data = result;  // Update the data for the dropdown
      });
  }
  getCountries() {
    const userId = this.persistance.getUserId()!;
    this.countryService.getAllCountryMaster(userId).subscribe((result: any) => {
      this.countries = result;
      console.log('countries', this.countries);
      this.addMapping.countryDD.data = result; // Update the data for the dropdown
    });
  }
  getCountrStateMapping() {
    this.countryService
      .getCountryStateMapping()
      .subscribe((result: CountryStateMapping[]) => {
        this.countryStateMapping = result;
        if (this.countryStateMapping.length > 0) {
          this.selectedCountries.push(this.countryStateMapping[0].countryName!);
        }
      });
  }

  getAllBillingLevel(): void {
    this.organizationService.getAllBillingLevel().subscribe((result: any) => {
      this.billingLevel = result;
      console.log('this.billingLevel', this.billingLevel);
    });
  }

  getAllProductType(): void {
    this.organizationService.getAllProductType().subscribe((result: any) => {
      this.typeOfProduct = result;
      console.log('this.typeOfProduct', this.typeOfProduct);
    });
  }

  onRowClicked(event: any): void {
    let id: number = event.data.organizationId;
    let entId: number = event.data.entityId;
    let billingId: number = event.data.billingDetilsId;
    if (
      (entId == null || entId == undefined) &&
      (billingId == null || billingId == undefined)
    ) {
      this.selectedRowData = event.data;
      const selectedOrganization = this.organizationNameWithoutStatus.find(
        (OrganizationDetail) => OrganizationDetail.id === id
      );
      if (selectedOrganization) {
        this.selectedOrganizationNameTop =
          selectedOrganization.organizationName;
        this.approvalForm.patchValue({
          organizationName: selectedOrganization.organizationName,
          entity: selectedOrganization.primaryEntity,
          countryId: this.selectedCountries,
          countryDDId: selectedOrganization.countryDDId,
          stateId: selectedOrganization.stateId,
          city: selectedOrganization.city,
          entityType: selectedOrganization.entityTypeId,
          majorIndustry: selectedOrganization.majorIndustryId,
          minorIndustry: selectedOrganization.minorIndustryId,
          address: selectedOrganization.address,
          pin: selectedOrganization.pin,
          typeOfProduct: selectedOrganization.typeOfProduct,
          numberOfEntities: selectedOrganization.numberOfEntities,
          numberOfUsers: selectedOrganization.numberOfUsers,
          billingLevel: selectedOrganization.billingLevelId,
          fullName: selectedOrganization.fullName,
          emailID: selectedOrganization.emailID,
          designation: selectedOrganization.designation,
          password: selectedOrganization.password,
        });

        this.getStateById(id);
        this.approvalForm.patchValue({
          stateId: this.selectedStateList.find(
            (x) => x == selectedOrganization.stateId
          ),
          majorIndustry: this.selectedMajorIndustryList.find(
            (x) => x.id == Number(selectedOrganization.majorIndustryId)
          )?.id,
          minorIndustry: this.selectedMinorIndustryList.find(
            (x) => x.id == Number(selectedOrganization.minorIndustryId)
          )?.id,
        });

        this.openXl(this.organizationapproval);
        this.organizationService.setSelectedOrganization(selectedOrganization);
      }
    } else if (entId > 0) {
      this.entityService.GetEntityView(entId).subscribe((res: EntityModel) => {
        this.entityDetails = res;
        this.entityStatus = event.data.status;
      });
      this.openXl(this.entityapproval);
    } else if (billingId > 0) {
      this.billingService
        .GetBillingDetailsView(billingId)
        .subscribe((res: BillingDetailsModel) => {
          this.billingDetails = res;
          this.entityStatus = event.data.status;
        });
      this.openXl(this.billingapproval);
    }
  }
  getStateById(countryId: any) {
    console.log('countryId', countryId);
    return this.countryService
      .getSateById(countryId, this.persistance.getUserId())
      .pipe(
        switchMap((result: any) => {
          this.formgroup.updateValueAndValidity();
          this.stateList = result;
          // Fetch industry mappings and return as observable
          return this.industryService.getIndustryMapping();
        }),
        switchMap((result: IndustryMapping[]) => {
          this.industryMapping = result;

          // Filter industry mappings based on countryId
          const filteredMappings = this.industryMapping.filter(
            (x) => x.countryId?.toString() === countryId?.toString()
          );

          // Map filtered industry mappings to new major industry items
          this.selectedMajorIndustryList = filteredMappings.map((x) => ({
            id: x.majorIndustryId !== null ? x.majorIndustryId : 0,
            countryId: Number(x.countryId),
            majorIndustryName:
              x.majorIndustryName !== null ? x.majorIndustryName : '',
            majorIndustryCode:
              x.majorIndustryCode !== null ? x.majorIndustryCode : '',
            status: null,
            createdOn: x.createdOn !== undefined ? x.createdOn : null,
            createdBy: x.createdBy !== undefined ? x.createdBy : null,
            modifiedOn: x.modifiedOn !== undefined ? x.modifiedOn : null,
            modifiedBy: x.modifiedBy !== undefined ? x.modifiedBy : null,
            uid: null,
            managerId: x.managerId !== null ? x.managerId : null,
            ApprovalUID: null,
          }));

          // Map filtered industry mappings to new minor industry items
          this.selectedMinorIndustryList = filteredMappings.map((x) => ({
            id: x.minorIndustryId !== null ? x.minorIndustryId : 0,
            majorIndustryId: x.majorIndustryId !== null ? x.majorIndustryId : 0,
            minorIndustryName:
              x.minorIndustryName !== null ? x.minorIndustryName : '',
            minorIndustryCode:
              x.minorIndustryCode !== null ? x.minorIndustryCode : '',
            status: null,
            createdOn: x.createdOn !== undefined ? x.createdOn : null,
            createdBy: x.createdBy !== undefined ? x.createdBy : null,
            modifiedOn: x.modifiedOn !== undefined ? x.modifiedOn : null,
            modifiedBy: x.modifiedBy !== undefined ? x.modifiedBy : null,
            uid: null,
            managerId: x.managerId !== null ? x.managerId : null,
            ApprovalUID: null,
          }));

          // Fetch industry mappings and return as observable
          return this.entityTypeService.getCountryEntityTypeMapping();
          //  return of('done');
        }),
        switchMap((result: EntityTypeModel[]) => {
          this.countryEntityTypeMapping = result;

          // Filter industry mappings based on countryId
          const filteredMappings = this.countryEntityTypeMapping.filter(
            (x) => x.countryId?.toString() === countryId?.toString()
          );

          // Map filtered industry mappings to new minor industry items
          this.selectedEntityList = filteredMappings.map((x) => ({
            id: x.id !== undefined ? x.id : 0,
            entityTypeId: x.entityTypeId !== undefined ? x.entityTypeId : 0,
            countryId:
              Number(x.countryId) !== undefined ? Number(x.countryId) : 0,
            countryName: x.countryName !== undefined ? x.countryName : null,
            managerId: x.managerId !== undefined ? x.managerId : 0,
            entityType: x.entityType !== undefined ? x.entityType : null,
            entityTypeCode:
              x.entityTypeCode !== undefined ? x.entityTypeCode : null,
            countryEntityTypeMappingId:
              x.countryEntityTypeMappingId !== undefined
                ? x.countryEntityTypeMappingId
                : 0,
            approvalStatus:
              x.approvalStatus !== undefined ? x.approvalStatus : null,
            fullName: x.fullName !== undefined ? x.fullName : null,
            statusId: x.statusId !== undefined ? x.statusId : 0,
            createdOn: x.createdOn !== undefined ? x.createdOn : null,
            createdBy: x.createdBy !== undefined ? x.createdBy : undefined, // Ensure createdBy is correctly handled
            modifiedOn: x.modifiedOn !== undefined ? x.modifiedOn : null,
            modifiedBy: x.modifiedBy !== undefined ? x.modifiedBy : 0,
            uid: null,
            hide: x.hide !== undefined ? x.hide : false,
          }));

          // Return a dummy observable or use 'of' to fulfill the requirement
          return of('done');
        })
      )
      .subscribe((result: any) => {
        // You can perform any post-processing logic here if needed
        if (result) {
          this.bindFormDatas();
        }
      });
  }
  bindFormDatas() {
    this.getCountries();
    this.getCountrStateMapping();
    this.getAllBillingLevel();
    this.getAllProductType();
  }

  loadData(organization: any) {
    console.log('organization Inside LoadData', organization);
    const selectedCountryIds = organization.countryId
      .split(',')
      .map((id: string) => id.trim());
    const selectedCountries = this.addMapping.countryDD.data.filter(
      (country: any) => selectedCountryIds.includes(country.id.toString())
    );

    this.approvalForm.patchValue({
      organizationName: organization.organizationName,
      entity: organization.primaryEntity,
      countryId: selectedCountries,
      countryDDId: organization.countryDDId,
      stateId: organization.stateId,
      city: organization.city,
      entityType: organization.entityTypeId,
      majorIndustry: organization.majorIndustryId,
      minorIndustry: organization.minorIndustryId,
      address: organization.address,
      pin: organization.pin,
      typeOfProduct: organization.typeOfProduct,
      numberOfEntities: organization.numberOfEntities,
      numberOfUsers: organization.numberOfUsers,
      billingLevel: organization.billingLevelId,
      fullName: organization.fullName,
      emailID: organization.emailID,
      designation: organization.designation,
      password: organization.password,
    });
  }
  approveSelectedBillingDetails(event: any): void {
    var data: Observable<any>[] = [];
    if (event.status == 1) {
      var model: accessModel = {
        managerId: this.persistance.getManagerId(),
        createdBy: this.persistance.getUserId()!,
        uid: this.selectedRowData.uid,
        id: this.selectedRowData.id,
      };
      if (event.createdBy != this.persistance.getUserId()) {
        model.billingDetailId = event.id;
        data.push(this.billingService.submitBillingApproved(model));
        this.reloaddata.emit();
      }
    }

    if (data.length > 0) {
      this.billingService.multipleAPIRequests(data).subscribe((result) => {
        window.location.reload();
      });
    }
  }
  rejectSelectedBillingDetails(event: any): void {
    var data: Observable<any>[] = [];
    if (event.status == 1) {
      var model: accessModel = {
        managerId: this.persistance.getManagerId(),
        createdBy: this.persistance.getUserId()!,
      };
      if (event.createdBy != this.persistance.getUserId()) {
        model.billingDetailId = event.id;
        data.push(this.billingService.submitBillingReject(model));
        this.reloaddata.emit();
      }
    }

    if (data.length > 0) {
      this.billingService.multipleAPIRequests(data).subscribe((result) => {
        window.location.reload();
      });
    }
  }
  approveSelectedEntity(event: any): void {
    var data: Observable<any>[] = [];
    if (event.status == 0) {
      var model: accessModel = {
        managerId: this.persistance.getManagerId(),
        createdBy: this.persistance.getUserId()!,
        uid: this.selectedRowData.uid,
        id: this.selectedRowData.id,
      };
      if (event.createdBy != this.persistance.getUserId()) {
        model.entityId = event.id;
        data.push(this.entityService.submitEntityApproved(model));
        this.reloaddata.emit();
        this.getOrgEntityList();
      }
    }

    if (data.length > 0) {
      this.entityService.multipleAPIRequests(data).subscribe((result) => {
        window.location.reload();
      });
      this.getOrgEntityList();
    }
  }

  rejectSelectedEntity(event: any): void {
    var data: Observable<any>[] = [];
    if (event.status == 0) {
      var model: accessModel = {
        managerId: this.persistance.getManagerId(),
        createdBy: this.persistance.getUserId()!,
      };
      if (event.createdBy != this.persistance.getUserId()) {
        model.entityId = event.id;
        data.push(this.entityService.submitEntityReject(model));
        this.reloaddata.emit();
      }
    }

    if (data.length > 0) {
      this.entityService.multipleAPIRequests(data).subscribe((result) => {
        window.location.reload();
      });
    }
  }
  getOrgEntityList() {
     this.userId = this.persistance.getUserId()!;
    this.organizationService
      .getOrgEntityListByUserId(this.userId)
      .subscribe((result: OrganizationEntityList[]) => {
        console.log('result', result);
        this.organizationEntityList = result;
      });
  }
  acceptSelectedInPopup(): void {
    var sourece: Observable<any>[] = [];
    if (this.selectedRowData.status == 'Pending') {
      var model: accessModel = {
        managerId: this.persistance.getManagerId(),
        createdBy: this.persistance.getUserId()!,
        uid: this.selectedRowData.uid,
        id: this.selectedRowData.organizationId,
      };
      if (this.selectedRowData.createdBy != this.persistance.getUserId()) {
        model.userId = this.selectedRowData.userId;
        sourece.push(
          this.organizationService.submitOrganizationApproved(model)
        );
        this.reloaddata.emit();
      }
    }

    if (sourece.length > 0) {
      this.organizationService
        .multipleAPIRequests(sourece)
        .subscribe((result) => {
          console.log(result);

          //this.gridApi!.applyTransaction({ update: selectedRows });
          //this.modalService.dismissAll(); // Close the modal
          //this.reloaddata.emit();
          window.location.reload();
          //this.openXl(this.approvalsModal);
        });
    }
  }
  rejectSelected(): void {
    const selectedNodes = this.gridApi!.getSelectedNodes();
    const selectedData = selectedNodes.map((node) => node.data);
    // Perform reject action on selectedData
    console.log('Rejected:', selectedData);
  }

  getOrganizationApproval() {
    this.userId = this.persistance.getUserId()!;
    this.entityService.getEntityApprovalList(this.userId).subscribe((res) => {
      this.rowData = res;
      this.getCounts(this.rowData);
    });
  }

  getCounts(data: any[]) {
    // Iterate through each object in the array
    data.forEach((item) => {
      // Check if the status is 'Approved'
      if (item.status.toLowerCase().trim() === 'approved') {
        this.approvedCount++; // Increment the count if status is 'Approved'
      }
      // Check if the status is 'Rejected'
      if (item.status.toLowerCase().trim() === 'rejected') {
        this.rejectedCount++; // Increment the count if status is 'Rejected'
      }
      // Check if the status is 'Pending'
      if (item.status.toLowerCase().trim() === 'pending') {
        this.pendingCount++; // Increment the count if status is 'Pending'
      }
    });
  }

  onOrganizationSelect(event: any) {
    this.router.navigate(['/organization-setup/organization']);
    let id: number = Number(event);

    console.log('Organization ID:', id);
    console.log('Organization List:', this.organizationName);

    const selectedOrganization = this.organizationName.find(
      (OrganizationDetail) => OrganizationDetail.id === id
    );
    this.organizationService.setSelectedOrganization(selectedOrganization);
  }
  closeOrganizationApproval() {
    (this.activeModel ?? this.modal)?.dismiss?.('dismissed');
  }
}
