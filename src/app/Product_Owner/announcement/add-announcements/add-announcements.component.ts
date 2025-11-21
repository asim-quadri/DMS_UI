import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Optional, Output, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { NotifierService } from 'angular-notifier';
import { AnnoucementModel } from 'src/app/Models/annoucementModel';
import { RegulationSetupDetailsModel, TOCListModel } from 'src/app/Models/regulationsetupModel';
import { UsersModel } from 'src/app/Models/Users';
import { accessModel } from 'src/app/Models/pendingapproval';
import { AnnouncementService } from 'src/app/Services/announcement.service';
import { CountryService } from 'src/app/Services/country.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { CompliancetrackerService } from 'src/app/Services/compliancetracker.service';
import { RxwebValidators } from '@rxweb/reactive-form-validators';

@Component({
  selector: 'app-add-announcements',
  templateUrl: './add-announcements.component.html',
  styleUrls: ['./add-announcements.component.scss']
})
export class AddAnnouncementsComponent implements OnInit, AfterViewInit {

  @Input()
  ActionType: any;
  regulations: any;

    @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

     @Output()
  public reloadPage: EventEmitter<string> = new EventEmitter<string>();
  @Input()
  set EventActionType(value: any) {
    this.ActionType = value;
    this.ngOnInit();
  }
  get EventActionType(): any[] {
    return this.RegulationSetupUID;
  }

  @Input()
  RegulationSetupUID: any;

  @Input()
  RegulationId: any;

  @Input()
  set EventRegulationId(value: any[]) {
    this.RegulationId = value;
    // this.ngOnInit();
  }

  get EventRegulationId(): any[] {
    return this.RegulationId;
  }

  @Input()
  regulationSetupName: any | undefined;

  @Input()
  set EventRegulationSetupUID(value: any[]) {
    this.RegulationSetupUID = value;
    // this.ngOnInit();
  }

  get EventRegulationSetupUID(): any[] {
    return this.RegulationSetupUID;
  }

  @Input()
  regulationSetupId: any;
  @Input()
  ParentComplianceId: any;
  @Input()
  RegComplianceUID: any;
  @Input()
  ParentComplianceName: any | undefined;

  @Input()
  complianceId: number | undefined;

  @Input()
  RegTOC: TOCListModel | undefined;


  announceent: AnnoucementModel | undefined | null;
  announcementId: number | null = null; // Store announcement ID for edit mode
  historyId: string | null = null; // Store history ID for pending approval mode

  @Input()
  regulationSetupScreen: boolean = true;

  private _compliances: any[] = [];

  @Input()
  get compliances(): any[] {
    return this._compliances;
  }
  
  set compliances(value: any[]) {
    console.log('Setting compliances to:', value);
    this._compliances = value || [];
  }

  private _selectionType: 'regulation' | 'compliance' | 'toc' | 'registration' = 'regulation';

  @Input()
  get selectionType(): 'regulation' | 'compliance' | 'toc' | 'registration' {
    return this._selectionType;
  }
  
  set selectionType(value: 'regulation' | 'compliance' | 'toc' | 'registration') {
    console.log('Setting selectionType to:', value);
    this._selectionType = value;
    if (this.formgroup) {
      this.onSelectionTypeChange();
    }
  }

  private _registrations: any[] = [];
  
  @Input()
  get registrations(): any[] {
    return this._registrations;
  }
  
  set registrations(value: any[]) {
    console.log('Setting registrations to:', value);
    this._registrations = value || [];
    // Enhance registrations with display names when data is set
    if (this._registrations.length > 0) {
      this.enhanceRegistrationsWithDisplayNames();
    }
  }

  @Input() 
  selectedRegistrationId: any; // Add property to receive selected registration ID

  private _tocDues: any[] = [];
  
  @Input()
  get tocDues(): any[] {
    return this._tocDues;
  }
  
  set tocDues(value: any[]) {
    console.log('Setting tocDues to:', value);
    this._tocDues = value || [];

    if (this._tocDues.length > 0) {
      this.enhanceTocDuesWithDisplayNames();
    }

    if (this._tocDues.length > 0 && this.selectionType === 'toc') {
      this.handleTocPreselection();
    }
  }

  @Input() 
  selectedTocId: any; // Add property to receive selected TOC ID for preselection

  @Input()
  selectedTocType: string = ''; // Add property to receive TOC type 

  @Input()
  isPendingMode: boolean = false; // New property to determine if in pending approval mode

  @Input()
  approvalData: any; // Property to receive approval data with displayName

  regulationSetup: RegulationSetupDetailsModel | undefined | null;
  isDataNotFound: boolean = false;

  constructor(
    private fb: FormBuilder,
    private notifier: NotifierService,
    public regulationSetupService: RegulationSetupService,
    public countryService: CountryService,
    private persistance: PersistenceService,
    private announcementService: AnnouncementService,
    private compliancetrackerService: CompliancetrackerService,
    private datePipe: DatePipe,
    private modalService: NgbModal,
    @Optional() public activeModal: NgbActiveModal
  ) {}

formgroup: FormGroup = this.fb.group({
  regulationId: [null],
  complianceId: [null],
  tocId: [null],
  registerId: [null],
  createdDate: ['',RxwebValidators.required({ message: 'Created date is required' })],
  applicableDate: ['',RxwebValidators.required({ message: 'Applicable date is required' })],
  description: ['',RxwebValidators.required({ message: 'Description is required' })],
  subject: ['',RxwebValidators.required({ message: 'Subject is required' })],
  announcementReferencecode: [''],
  createdByName: [null],
  fileName: [''],
  fileUpload: [''],
  fileid:[0]
});

  @ViewChild('descriptionModal') descriptionModal!: TemplateRef<any>;

  /**
   * Opens the description modal to show full description content
   */
  openDescriptionModal(): void {
    if (this.descriptionModal) {
      this.modalService.open(this.descriptionModal, {
        size: 'lg',
        centered: true,
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.formgroup.patchValue({
        fileUpload: file
      });
    }
  }

  updateFormValidation() {
    this.formgroup.get('regulationId')?.clearValidators();
    this.formgroup.get('complianceId')?.clearValidators();
    this.formgroup.get('tocId')?.clearValidators();
    this.formgroup.get('registerId')?.clearValidators();
    
    if (this.selectionType === 'regulation') {
      this.formgroup.get('regulationId')?.setValidators([Validators.required]);
    } else if (this.selectionType === 'compliance') {
      this.formgroup.get('complianceId')?.setValidators([Validators.required]);
    } else if (this.selectionType === 'toc') {
      this.formgroup.get('tocId')?.setValidators([Validators.required]);
    } else if (this.selectionType === 'registration') {
      this.formgroup.get('registerId')?.setValidators([Validators.required]);
    }
    
    this.formgroup.get('regulationId')?.updateValueAndValidity();
    this.formgroup.get('complianceId')?.updateValueAndValidity();
    this.formgroup.get('tocId')?.updateValueAndValidity();
    this.formgroup.get('registerId')?.updateValueAndValidity();
  }
  onSelectionTypeChange() {
    this.updateFormValidation();
    if (this.selectionType === 'regulation') {
      this.formgroup.get('complianceId')?.setValue(null);
      this.formgroup.get('tocId')?.setValue(null);
      this.formgroup.get('registerId')?.setValue(null);
    } else if (this.selectionType === 'compliance') {
      this.formgroup.get('regulationId')?.setValue(null);
      this.formgroup.get('tocId')?.setValue(null);
      this.formgroup.get('registerId')?.setValue(null);
    } else if (this.selectionType === 'toc') {
      this.formgroup.get('regulationId')?.setValue(null);
      this.formgroup.get('complianceId')?.setValue(null);
      this.formgroup.get('registerId')?.setValue(null);
      this.formgroup.get('tocId')?.setValue(null);
      if (this.selectedTocId) {
        setTimeout(() => {
          this.formgroup.get('tocId')?.setValue(this.selectedTocId);
          this.formgroup.get('tocId')?.updateValueAndValidity();
        }, 100);
      }
    } else if (this.selectionType === 'registration') {
      this.formgroup.get('regulationId')?.setValue(null);
      this.formgroup.get('complianceId')?.setValue(null);
      this.formgroup.get('tocId')?.setValue(null);
      
      // Load registrations if they're not already loaded
      if (this.registrations.length === 0) {
        this.loadRegistrationsForDropdown();
      }
      
      // For registration type, set the preselected value in registerId field
      if (this.selectedRegistrationId) {
        setTimeout(() => {
          this.formgroup.get('registerId')?.setValue(this.selectedRegistrationId);
          this.formgroup.get('registerId')?.updateValueAndValidity();
        }, 100);
      }
    }
  }
filetempname: string = '';
  async ngOnInit() {
    this.updateFormValidation();
    this.getAllRegulationSetupDetails();
    
    // Debug approval data
    if (this.approvalData) {
    }

    // Handle Create action (Add New Announcement button clicked)
    if (this.ActionType == 'Create') {
      this.isDataNotFound = false;
      this.announcementId = null; // Reset ID for create mode
      this.historyId = null; // Reset history ID for create mode
      const date = this.datePipe.transform(new Date(), 'dd-MMM-yyyy')
      var currentUser = this.persistance.getUserName();
      
      // Set values based on selection type
      if (this.selectionType === 'regulation') {
        const regulationIdValue = this.regulationSetupId || this.RegulationId || this.RegulationSetupUID;
        this.formgroup.controls['regulationId'].setValue(regulationIdValue);
        this.formgroup.controls['complianceId'].setValue(null);
        this.formgroup.controls['tocId'].setValue(null);
      } else if (this.selectionType === 'compliance') {
        const complianceIdValue = this.complianceId || this.RegulationId;
        this.formgroup.controls['complianceId'].setValue(complianceIdValue);
        this.formgroup.controls['regulationId'].setValue(null);
        this.formgroup.controls['tocId'].setValue(null);
      } else if (this.selectionType === 'toc') {
        const tocIdValue = this.selectedTocId || this.RegulationId;

        this.formgroup.controls['tocId'].setValue(this.selectedTocId);
        this.formgroup.controls['regulationId'].setValue(null);
        this.formgroup.controls['complianceId'].setValue(null);
        this.formgroup.controls['registerId'].setValue(null);
      } else if (this.selectionType === 'registration') {
        const registrationIdValue = this.selectedRegistrationId || this.RegulationId;
        this.formgroup.controls['regulationId'].setValue(null);
        this.formgroup.controls['complianceId'].setValue(null);
        this.formgroup.controls['tocId'].setValue(null);
        this.formgroup.controls['registerId'].setValue(this.selectedRegistrationId);
      }
      
      // Update validation after setting values
      this.updateFormValidation();
      
      this.formgroup.controls['createdDate'].setValue(date);
      this.formgroup.controls['createdByName'].setValue(currentUser);
      this.formgroup.controls['applicableDate'].setValue('');
      this.formgroup.controls['description'].setValue('');
      this.formgroup.controls['subject'].setValue('');
      this.formgroup.controls['announcementReferencecode'].setValue('');
      
      this.getNextAnnouncementReferenceCode();
      
      this.formgroup.patchValue({
        uid: this.regulationSetup?.uid,
        id: this.regulationSetup?.id,
        regulationSetupId: this.regulationSetup?.id,
      });
    }else if ((this.ActionType == 'Edit'||this.ActionType.toLowerCase() == 'approve' ) && (this.RegulationSetupUID != null || this.complianceId != null)) {
      if (!this.compliances || this.compliances.length === 0) {
        console.log('Loading compliances for Edit mode...');
        try {
          await this.loadCompliances();
        } catch (error) {
          console.error('Failed to load compliances:', error);
        }
      }
      // For pending mode, use approverUID from approval data, otherwise use the regular logic
      const targetUID = this.isPendingMode && this.approvalData?.approverUID 
        ? this.approvalData.approverUID 
        : (this.selectionType === 'compliance' ? this.complianceId : this.RegulationSetupUID);
      console.log('Edit mode - fetching announcement data for', this.selectionType, 'ID:', targetUID);
      console.log('isPendingMode:', this.isPendingMode, 'approvalData:', this.approvalData);  
      
      const serviceCall = this.isPendingMode 
        ? this.announcementService.getHistoryAnnouncementByID(targetUID)
        : this.announcementService.getAnouncementDetailsById(targetUID);
        
      serviceCall
        .subscribe({
          next: async (result: any) => {
            console.log('Service response received:', result);
            if (result != null && result !== undefined && (result.id || result.uid || result.subject)) {
              this.announceent = result;
              if (this.isPendingMode) {
                this.historyId = result.uid || result.id || this.RegulationSetupUID; 
                this.announcementId = result.id;
              } else {
                this.announcementId = result.id;
              }
              this.isDataNotFound = false;

              const complianceId=this.ActionType=='Edit' ? result.complainceId:result.complianceId;
              const date = this.datePipe.transform(result.applicableDate, 'yyyy-MM-dd')
              this.formgroup.controls['regulationId'].setValue(result.regulationId)
              this.formgroup.controls['complianceId'].setValue(complianceId)
              this.formgroup.controls['createdDate'].setValue(result.createdDate)
              this.formgroup.controls['createdByName'].setValue(result.createdByName)
              this.formgroup.controls['applicableDate'].setValue(date)
              this.formgroup.controls['description'].setValue(result.description)
              this.formgroup.controls['subject'].setValue(result.subject)
              this.formgroup.controls['announcementReferencecode'].setValue(result.announcementReferencecode)
                this.formgroup.controls['fileid'].setValue(result?.fileinfo[0]?.Id || 0)
                this.filetempname=result?.fileinfo[0]?.Filepath
                  this.formgroup.controls['fileName'].setValue(result?.fileinfo[0]?.FileName);
              const complianceIdValue = result.complianceId || result.ComplianceId || result.compliance_id;
              const regulationIdValue = result.regulationId || result.RegulationId || result.regulation_id || result.regulationSetupId;
              const tocIdValue = result.tocId || result.TOCId || result.toc_id;
              const registerIdValue = result.registerId || result.RegisterId || result.register_id || result.registerationId;

              
              // Set form values for all fields
              this.formgroup.controls['tocId'].setValue(tocIdValue);
              this.formgroup.controls['registerId'].setValue(registerIdValue);

              if (registerIdValue && registerIdValue !== null && registerIdValue !== 0) {
                this.selectionType = 'registration';
                
                if (this.isPendingMode) {
                  // For approvals list, fetch actual registration name and regulation name using registerId
                  this.getRegistrationDetailsForApproval(registerIdValue, result).then((registrationDisplayData: any) => {
                    this.registrations = [{
                      id: registerIdValue,
                      registrationName: registrationDisplayData.displayName,
                      displayName: registrationDisplayData.displayName,
                      regulationName: registrationDisplayData.regulationName,
                      complianceName: registrationDisplayData.complianceName,
                      actualRegistrationName: registrationDisplayData.actualRegistrationName
                    }];
                    this.selectedRegistrationId = registerIdValue;
                    
                    // Set the form value to ensure dropdown binding
                    setTimeout(() => {
                      this.formgroup.get('registerId')?.setValue(registerIdValue);
                      this.formgroup.get('registerId')?.updateValueAndValidity();
                    }, 50);
                    
                  }).catch((error: any) => {
                    console.error('Error getting registration details for approval:', error);
                    // Fallback to basic display
                    const fallbackName = result.displayName || 'Registration';
                    this.registrations = [{
                      id: registerIdValue,
                      registrationName: fallbackName,
                      displayName: fallbackName,
                      regulationName: '',
                      complianceName: ''
                    }];
                    this.selectedRegistrationId = registerIdValue;
                  });
                }
              } else if (tocIdValue && tocIdValue !== null && tocIdValue !== 0) {
                this.selectionType = 'toc';
                // Load TOC data for dropdown in pending mode
                if (this.isPendingMode) {
                  // For approvals list, fetch actual TOC name and regulation name using tocId
                  // Use approval data if available, otherwise use the loaded result
                  const approvalDataToUse = this.approvalData || result;
                  this.getTOCDetailsForApproval(tocIdValue, approvalDataToUse).then((tocDisplayData: any) => {
                    this.tocDues = [{
                      id: tocIdValue,
                      displayName: tocDisplayData.displayName,
                      tocRuleType: tocDisplayData.actualTOCName,
                      regulationName: tocDisplayData.regulationName,
                      complianceName: tocDisplayData.complianceName,
                      actualTOCName: tocDisplayData.actualTOCName
                    }];
                    this.selectedTocId = tocIdValue;
                    
                    setTimeout(() => {
                      this.formgroup.get('tocId')?.setValue(tocIdValue);
                      this.formgroup.get('tocId')?.updateValueAndValidity();
                    }, 50);
                    
                    console.log('Created tocDues array for pending mode:', this.tocDues);
                  }).catch((error: any) => {
                    console.error('Error getting TOC details for approval:', error);
                    // Fallback to basic display - prioritize approvalData displayName
                    const fallbackName = this.approvalData?.displayName || result.displayName || 'TOC';
                  
                    this.tocDues = [{
                      id: tocIdValue,
                      displayName: fallbackName,
                      tocRuleType: fallbackName,
                      regulationName: '',
                      complianceName: ''
                    }];
                    this.selectedTocId = tocIdValue;
                  });
                }
              } else if (complianceIdValue && complianceIdValue !== null && complianceIdValue !== 0) {
                this.selectionType = 'compliance';
              } else if (regulationIdValue && regulationIdValue !== null && regulationIdValue !== 0) {
                this.selectionType = 'regulation';
              } else if (this.isPendingMode) {
                
                // Check if the target UID we used to fetch the data gives us a hint
                // If we have compliances loaded and the announcement exists, try to match it
                if (this.compliances && this.compliances.length > 0) {
                  // Try to find a matching compliance
                  const matchingCompliance = this.compliances.find((c: any) => 
                    c.id === this.RegulationSetupUID || c.uid === this.RegulationSetupUID
                  );
                  console.log('Matching compliance found:', matchingCompliance);
                  
                  if (matchingCompliance) {
                    this.selectionType = 'compliance';
                   
                    this.formgroup.controls['complianceId'].setValue(matchingCompliance.id);
                  } else {
                    this.selectionType = 'regulation';
                  }
                } else {
                  console.log('No compliances available, defaulting to regulation');
                }
              }

              // Update form validation after setting selection type
              this.updateFormValidation();
              
              if (this.isPendingMode) {
                this.disableFormControls();
              }
            } else {
              this.announceent = null;
              if (this.selectionType === 'compliance') {
                this.isDataNotFound = true; 
              } else if (this.selectionType === 'regulation') {
                console.log('No announcement found for regulation - hiding form');
                this.isDataNotFound = true; 
              }
            }
          },
          error: (error: any) => {
            console.log(error);

            this.announceent = null;
            if (this.selectionType === 'compliance') {
              console.log('Error fetching announcement for compliance - hiding form');
              this.isDataNotFound = true;
            } else if (this.selectionType === 'regulation') {
              console.log('Error fetching announcement for regulation - hiding form');
              this.isDataNotFound = true; 
            }
          },
        })
    } else {
      this.isDataNotFound = true;
    }
  }

  ngAfterViewInit(): void {
    // Handle preselection after view is initialized
    if (this.selectionType === 'registration' && this.selectedRegistrationId && this.ActionType === 'Create') {
        this.formgroup.controls['registerId'].setValue(this.selectedRegistrationId);
        this.formgroup.controls['registerId'].updateValueAndValidity();

      // Use the ensurePreselection method as a fallback
      this.ensurePreselection();
    } else if (this.selectionType === 'toc' && this.ActionType === 'Create') {
      // Use multiple attempts with increasing delays for TOC preselection
      setTimeout(() => this.handleTocPreselection(), 300);
      setTimeout(() => this.handleTocPreselection(), 600);
      setTimeout(() => this.handleTocPreselection(), 1000);
    }
  }

  getAllRegulationSetupDetails(){
    this.regulationSetupService.getRegulationSetupDetails().subscribe((result: any) => {
      this.regulations = result;
    })
  }

  // Method to get registration details for approval list items
  private async getRegistrationDetailsForApproval(registerId: number, approvalData: any): Promise<any> {
    try {
      
      // For registration, just use "Registration" as type name and get regulation name
      return new Promise((resolve) => {
        // Get regulation name from registration data if available
        this.regulationSetupService.getAllRegisteration().subscribe({
          next: (registrations: any) => {
            if (registrations && registrations.length > 0) {
              // Find the registration by ID to get regulation info
              const registration = registrations.find((reg: any) => reg.id === registerId);
              
              if (registration) {
                
                // Get the regulation name from registration
                this.getRegulationNameFromRegistration(registration).then((regulationName: string) => {
                  // Always use "Registration" as the type name
                  const registrationTypeName = 'Registration';
                  let displayName = registrationTypeName;
                  
                  // Add regulation name if available
                  if (regulationName && regulationName.trim() !== '') {
                    displayName = `${registrationTypeName} - ${regulationName}`;
                  }
                  
                  
                  resolve({
                    displayName: displayName,
                    actualRegistrationName: registrationTypeName,
                    regulationName: regulationName,
                    complianceName: registration.complianceName || ''
                  });
                });
              } else {
                resolve({
                  displayName: 'Registration',
                  actualRegistrationName: 'Registration',
                  regulationName: '',
                  complianceName: ''
                });
              }
            } else {
              resolve({
                displayName: 'Registration',
                actualRegistrationName: 'Registration',
                regulationName: '',
                complianceName: ''
              });
            }
          },
          error: (error: any) => {
            console.error('Error getting registrations from service:', error);
            resolve({
              displayName: 'Registration',
              actualRegistrationName: 'Registration',
              regulationName: '',
              complianceName: ''
            });
          }
        });
      });
    } catch (error) {
      console.error('Error in getRegistrationDetailsForApproval:', error);
      return {
        displayName: 'Registration',
        actualRegistrationName: 'Registration',
        regulationName: '',
        complianceName: ''
      };
    }
  }

  private async getRegulationNameFromRegistration(registration: any): Promise<string> {
    try {
      
      // Get regulation setup ID from registration
      const regulationSetupId = registration.regulationSetupId || registration.regulationId;
      
      if (!regulationSetupId) {
   return '';
      }

      // If we already have the regulations loaded, find the name
      if (this.regulations && this.regulations.length > 0) {
        const regulation = this.regulations.find((reg: any) => 
          reg.id === regulationSetupId || reg.uid === regulationSetupId
        );
        if (regulation) {
          return regulation.regulationName || regulation.name || '';
        }
      }

      // If not found in cache, fetch from service
      return new Promise((resolve) => {
        this.regulationSetupService.getRegulationSetupDetails().subscribe((regulations: any) => {
          if (regulations && regulations.length > 0) {
            const regulation = regulations.find((reg: any) => 
              reg.id === regulationSetupId || reg.uid === regulationSetupId
            );
            if (regulation) {
              resolve(regulation.regulationName || regulation.name || '');
            } else {
              resolve('');
            }
          } else {
            resolve('');
          }
        });
      });
      
    } catch (error) {
      console.error('Error getting regulation name from registration:', error);
      return '';
    }
  }
  private async getTOCDetailsForApproval(tocId: number, approvalData: any): Promise<any> {
    try {
      let regulationName = '';
      
      if (approvalData.approverUID) {
        if (this.regulations && this.regulations.length > 0) {
          const regulation = this.regulations.find((reg: any) => 
            reg.id === approvalData.approverUID || reg.uid === approvalData.approverUID
          );
          if (regulation) {
            regulationName = regulation.regulationName || regulation.name || '';
            console.log('Found regulation name from cached data using approverUID:', regulationName);
          }
        }
        if (!regulationName) {
          try {
            regulationName = await new Promise<string>((resolve) => {
              this.regulationSetupService.getRegulationSetupDetails().subscribe((regulations: any) => {
                if (regulations && regulations.length > 0) {
                  const regulation = regulations.find((reg: any) => 
                    reg.id === approvalData.approverUID || reg.uid === approvalData.approverUID
                  );
                  if (regulation) {
                    resolve(regulation.regulationName || regulation.name || '');
                  } else {
                    resolve('');
                  }
                } else {
                  resolve('');
                }
              });
            });
          } catch (error) {
            console.log('Error fetching regulation using approverUID:', error);
          }
        }
      }
      
      const regulationId = approvalData.regulationId || this.regulationSetupId || 0;
      return new Promise((resolve) => {
        this.regulationSetupService.GetTOCRules(tocId, regulationId, 'Rules').subscribe({
          next: (tocRules: any) => {
            if (tocRules && tocRules.length > 0) {
              
              let tocTypeName: string;
              
              if (approvalData.displayName && approvalData.displayName.trim() !== '') {
                tocTypeName = approvalData.displayName;
              } else {
                tocTypeName = this.determineTOCType(tocRules[0], approvalData);
              }
              
              let displayName = tocTypeName;
              
              if (regulationName && regulationName.trim() !== '') {
                displayName = `${tocTypeName} - ${regulationName}`;
              }

              resolve({
                displayName: displayName,
                actualTOCName: tocTypeName,
                regulationName: regulationName,
                complianceName: tocRules[0].complianceName || ''
              });
            } else {
              const tocTypeName = approvalData.displayName;
              let displayName = tocTypeName;
              
              if (regulationName && regulationName.trim() !== '') {
                displayName = `${tocTypeName} - ${regulationName}`;
              }
              
              resolve({
                displayName: displayName,
                actualTOCName: tocTypeName,
                regulationName: regulationName,
                complianceName: ''
              });
            }
          },
          error: (error: any) => {
            console.error('Error getting TOC rules from service:', error);
            // Use displayName from approval data if available, otherwise use fallback
            const tocTypeName = approvalData.displayName || 'TOC';
            
            // Use the regulation name we already found using approverUID
            let displayName = tocTypeName;
            
            // Add regulation name if available
            if (regulationName && regulationName.trim() !== '') {
              displayName = `${tocTypeName} - ${regulationName}`;
            }
            
            resolve({
              displayName: displayName,
              actualTOCName: tocTypeName,
              regulationName: regulationName,
              complianceName: ''
            });
          }
        });
      });
    } catch (error) {
      console.error('Error in getTOCDetailsForApproval:', error);
      return {
        displayName: approvalData.displayName || 'TOC',
        actualTOCName: approvalData.displayName || 'TOC',
        regulationName: '',
        complianceName: ''
      };
    }
  }

  // Method to get regulation name from TOC data
  private async getRegulationNameFromTOC(tocData: any): Promise<string> {
    try {
      
      const regulationSetupId = tocData.regulationSetupId || tocData.regulationId;
   
      if (!regulationSetupId) {
        return '';
      }

      if (this.regulations && this.regulations.length > 0) {
        const regulation = this.regulations.find((reg: any) => 
          reg.id === regulationSetupId || reg.uid === regulationSetupId
        );
        if (regulation) {
          return regulation.regulationName || regulation.name || '';
        }
      }

      // If not found in cache, fetch from service
      return new Promise((resolve) => {
        this.regulationSetupService.getRegulationSetupDetails().subscribe((regulations: any) => {
          if (regulations && regulations.length > 0) {
            const regulation = regulations.find((reg: any) => 
              reg.id === regulationSetupId || reg.uid === regulationSetupId
            );
            if (regulation) {
              resolve(regulation.regulationName || regulation.name || '');
            } else {
              resolve('');
            }
          } else {
            resolve('');
          }
        });
      });
      
    } catch (error) {
      console.error('Error getting regulation name from TOC:', error);
      return '';
    }
  }

  private determineTOCType(tocData: any, approvalData: any): string {
    if (tocData.typeOfComplianceName) {
      const typeName = tocData.typeOfComplianceName.toLowerCase();
      if (typeName.includes('payment') || typeName.includes('fee') || typeName.includes('dues')) {
        return 'Payment';
      } else if (typeName.includes('filing') || typeName.includes('return') || typeName.includes('submission')) {
        return 'Filing';
      } else if (typeName.includes('activity') || typeName.includes('operation') || typeName.includes('business')) {
        return 'Activity';
      } else if (typeName.includes('event') || typeName.includes('meeting') || typeName.includes('notice')) {
        return 'Events';
      }
      
      if (['payment', 'filing', 'activity', 'events', 'compliance'].includes(typeName)) {
        return typeName.charAt(0).toUpperCase() + typeName.slice(1);
      }
    }
    
    if (tocData.tocName) {
      const tocName = tocData.tocName.toLowerCase();
      if (tocName.includes('payment') || tocName.includes('fee') || tocName.includes('dues')) {
        return 'Payment';
      } else if (tocName.includes('filing') || tocName.includes('return') || tocName.includes('submission')) {
        return 'Filing';
      } else if (tocName.includes('activity') || tocName.includes('operation') || tocName.includes('business')) {
        return 'Activity';
      } else if (tocName.includes('event') || tocName.includes('meeting') || tocName.includes('notice')) {
        return 'Events';
      }
    }
    
    if (tocData.ruleType) {
      const ruleType = tocData.ruleType.toLowerCase();
      console.log('Found ruleType:', tocData.ruleType);
      
      if (ruleType.includes('payment') || ruleType === 'payments') {
        return 'Payment';
      } else if (ruleType.includes('filing') || ruleType === 'filing') {
        return 'Filing';
      } else if (ruleType.includes('activity') || ruleType === 'activity') {
        return 'Activity';
      } else if (ruleType.includes('event') || ruleType === 'events') {
        return 'Events';
      }
    }
    return "Compliance"
  }

  private async getRegulationNameForApproval(tocData: any, approvalData: any): Promise<string> {
    try {
      
      if (approvalData && approvalData.approverUID) {
        
        // Check if we have regulations cached
        if (this.regulations && this.regulations.length > 0) {
          const regulation = this.regulations.find((reg: any) => 
            reg.id === approvalData.approverUID || reg.uid === approvalData.approverUID
          );
          if (regulation) {
            return regulation.regulationName || regulation.name || '';
          }
        }
        
        try {
          const regulationName = await new Promise<string>((resolve) => {
            this.regulationSetupService.getRegulationSetupDetails().subscribe((regulations: any) => {
              if (regulations && regulations.length > 0) {
                const regulation = regulations.find((reg: any) => 
                  reg.id === approvalData.approverUID || reg.uid === approvalData.approverUID
                );
                if (regulation) {
                  resolve(regulation.regulationName || regulation.name || '');
                } else {
                  resolve('');
                }
              } else {
                resolve('');
              }
            });
          });
          
          if (regulationName && regulationName.trim() !== '') {
            return regulationName;
          }
        } catch (error) {
        }
      }
      
      if (tocData && Object.keys(tocData).length > 0) {
        let regulationName = await this.getRegulationNameFromTOC(tocData);
        if (regulationName && regulationName.trim() !== '') {
          return regulationName;
        }
      }
      
      
      if (approvalData) {
        let regulationName = await this.getRegulationNameFromApprovalData(approvalData);
        if (regulationName && regulationName.trim() !== '') {
          return regulationName;
        }
      }
      
      
      if (this.RegulationSetupUID) {
        // Check if we have regulations cached
        if (this.regulations && this.regulations.length > 0) {
          const regulation = this.regulations.find((reg: any) => 
            reg.id === this.RegulationSetupUID || reg.uid === this.RegulationSetupUID
          );
          if (regulation) {
            return regulation.regulationName || regulation.name || '';
          }
        }
        
        return new Promise((resolve) => {
          this.regulationSetupService.getRegulationSetupDetails().subscribe((regulations: any) => {
            console.log('Received regulations from service, count:', regulations?.length);
            if (regulations && regulations.length > 0) {
              const regulation = regulations.find((reg: any) => 
                reg.id === this.RegulationSetupUID || reg.uid === this.RegulationSetupUID
              );
              if (regulation) {
                resolve(regulation.regulationName || regulation.name || '');
              } else {
                resolve('');
              }
            } else {
              resolve('');
            }
          });
        });
      }
      if (approvalData && approvalData.approverUID) {
        
        if (this.regulations && this.regulations.length > 0) {
          const regulation = this.regulations.find((reg: any) => 
            reg.id === approvalData.approverUID || reg.uid === approvalData.approverUID
          );
          if (regulation) {
            return regulation.regulationName || regulation.name || '';
          }
        }
      }
      return '';
      
    } catch (error) {
      console.error('Error getting regulation name for approval:', error);
      return '';
    }
  }

  private async getRegulationNameFromApprovalData(approvalData: any): Promise<string> {
    try {
      const regulationSetupId = approvalData.regulationId || approvalData.RegulationSetupUID || 
                                this.regulationSetupId || this.RegulationSetupUID
      
      if (!regulationSetupId) {
        return '';
      }

      // If we already have the regulations loaded, find the name
      if (this.regulations && this.regulations.length > 0) {
        const regulation = this.regulations.find((reg: any) => 
          reg.id === regulationSetupId || reg.uid === regulationSetupId
        );
        if (regulation) {
          return regulation.regulationName || regulation.name || '';
        }
      }

      return new Promise((resolve) => {
        this.regulationSetupService.getRegulationSetupDetails().subscribe((regulations: any) => {
          if (regulations && regulations.length > 0) {
            const regulation = regulations.find((reg: any) => 
              reg.id === regulationSetupId || reg.uid === regulationSetupId
            );
            if (regulation) {
              resolve(regulation.regulationName || regulation.name || '');
            } else {
              resolve('');
            }
          } else {
            resolve('');
          }
        });
      });
      
    } catch (error) {
      console.error('Error getting regulation name from approval data:', error);
      return '';
    }
  }

  // Method to handle TOC preselection after data is loaded
  handleTocPreselection() {
    if (this.selectionType === 'toc' && this.selectedTocId && this.tocDues && this.tocDues.length > 0) {

      // Try multiple matching strategies
      let matchingTocDue = null;

      // Strategy 1: Direct ID match
      matchingTocDue = this.tocDues.find(t => 
        t.id === this.selectedTocId || 
        t.typeOfComplianceId === this.selectedTocId
      );

      // Strategy 2: Match by TOC type if no direct match
      if (!matchingTocDue && this.selectedTocType) {
        matchingTocDue = this.tocDues.find(t => 
          t.tocRuleType && 
          t.tocRuleType.toLowerCase().includes(this.selectedTocType.toLowerCase())
        );
      }

      // Strategy 3: Match by display name containing the selected type
      if (!matchingTocDue && this.selectedTocType) {
        matchingTocDue = this.tocDues.find(t => 
          t.displayName && 
          t.displayName.toLowerCase().includes(this.selectedTocType.toLowerCase())
        );
      }

      if (matchingTocDue) {
        this.formgroup.controls['tocId'].setValue(matchingTocDue.id);
        this.formgroup.controls['tocId'].updateValueAndValidity();
      } 
    }
  }

  loadCompliances(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.compliancetrackerService.getAllCompliances().subscribe({
        next: (result: any) => {
          this.compliances = result || [];
          resolve();
        },
        error: (error: any) => {
          console.error('Error loading compliances:', error);
          this.compliances = [];
          reject(error);
        }
      });
    });
  }

  onSubmit() {
    this.markAllFieldsAsTouched();
    
    if (this.formgroup.valid) {
      var formValues = this.formgroup.getRawValue();
      
      const formData = new FormData();
      
      if (formValues.regulationId) formData.append('regulationId', formValues.regulationId.toString());
      if (formValues.complianceId) formData.append('complianceId', formValues.complianceId.toString());
      if (formValues.tocId) formData.append('tocId', formValues.tocId.toString());
      if (formValues.registerId) formData.append('registerId', formValues.registerId.toString());
      
      formData.append('createdDate', formValues.createdDate || '');
      formData.append('applicableDate', formValues.applicableDate || '');
      formData.append('description', formValues.description || '');
      formData.append('subject', formValues.subject || '');
      formData.append('announcementReferencecode', formValues.announcementReferencecode || '');
      formData.append('createdByName', formValues.createdByName || '');
      formData.append('createdBy', this.persistance.getUserId()!.toString());
      
      const managerId = this.persistance.getManagerId();
      if (managerId) {
        formData.append('approvalManagerId', managerId.toString());
      }

      // File Upload
      const file = this.formgroup.get('fileUpload')?.value;
      if (file) {
        formData.append('file', file);
        formData.append('fileid', formValues.fileid || 0);
        formData.append('fileName', formValues.fileName || 'N/A' );
      }
      


      // If in edit mode, include the announcement ID for update
      if (this.ActionType === 'Edit' && this.announcementId) {
        formData.append('id', this.announcementId.toString());
      }

      const isEditMode = this.ActionType === 'Edit' && this.announcementId;
      
      this.announcementService.addRegulationSetupDetails(formData).subscribe(
        (result: UsersModel) => {
          if (result.responseCode == 1) {
            const successMessage = isEditMode ? 'Announcement updated successfully!' : 'Announcement created successfully!';
            this.notifier.notify('success', result.responseMessage || successMessage);
            this.reloadPage.emit('reload');
            this.formgroup.reset();
            this.announcementId = null; // Reset ID after successful operation
            this.activeModal?.close('success');
          } else {
            this.notifier.notify('error', result.responseMessage);
          }
        },
        (error) => {
          const errorMessage = isEditMode ? 'Failed to update announcement' : 'Failed to create announcement';
          this.notifier.notify('error', error?.message || errorMessage);
        }
      );
    } else {
      console.log('Form is invalid. Please check the required fields.');
    }
    return;
  }

  // Helper method to mark all form controls as touched
  private markAllFieldsAsTouched() {
    Object.keys(this.formgroup.controls).forEach(key => {
      const control = this.formgroup.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  
  getNextAnnouncementReferenceCode() {
    try {
      this.announcementService
        .getNextAnnouncementReferenceCode()
        .subscribe((nextCode: string) => {
          this.formgroup.controls[
            'announcementReferencecode'
          ].setValue(nextCode);
          this.formgroup
            .get('announcementReferencecode')
            ?.disable();
        });
    } catch (err) {
      console.error('error', 'An unexpected error occurred');
    }
  }
  generateAnnouncementReferenceCode(event: any) {
    let name = event.target.value;
    const firstThree = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const nextCode =
      this.formgroup.get('announcementReferencecode')?.value || '';
    const firstNumberMatch = nextCode.match(/\d+/);
    const firstNumber = firstNumberMatch ? firstNumberMatch[0] : '';
    const code = `${firstThree}${firstNumber}`;
    this.formgroup
      .get('announcementReferencecode')
      ?.setValue(code);
    this.formgroup.get('announcementReferencecode')?.disable();
  }

  disableFormControls() {
    // Disable all form controls to make the form read-only in pending mode
    Object.keys(this.formgroup.controls).forEach(key => {
      this.formgroup.get(key)?.disable();
    });
  }

  onAccept() {
    const uidToUse = this.historyId || this.RegulationSetupUID;
    
    
    if (!uidToUse) {
      this.notifier.notify('error', 'No announcement UID available for approval');
      return;
    }
    
    const model: accessModel = {
      managerId: this.persistance.getManagerId(),
      createdBy: this.persistance.getUserId()!,
      uid: uidToUse.toString()
    };

    this.announcementService.submitApproved(model)
      .subscribe({
        next: (result: any) => {
          if (result) {
            this.notifier.notify('success', result.responseMessage || 'Announcement accepted successfully');
            this.reloaddata.emit('approved');
            this.activeModal?.close('accepted');
          } else {
            this.notifier.notify('error', result.responseMessage || 'Failed to accept announcement');
          }
        },
        error: (error: any) => {
          this.notifier.notify('error', 'Failed to accept announcement');
          console.error('Error accepting announcement:', error);
        }
      });
  }

  onReject() {
    // Use historyId if available (for pending mode), otherwise use RegulationSetupUID
    const uidToUse = this.historyId || this.RegulationSetupUID;
    if (!uidToUse) {
      this.notifier.notify('error', 'No announcement UID available for rejection');
      return;
    }
    
    const model: accessModel = {
      managerId: this.persistance.getManagerId(),
      createdBy: this.persistance.getUserId()!,
      uid: uidToUse.toString()
    };
    
    this.announcementService.submitReject(model)
      .subscribe({
        next: (result: any) => {
          if (result) {
            this.notifier.notify('success', result.responseMessage || 'Announcement rejected successfully');
            this.reloaddata.emit('rejected');
            this.activeModal?.close('rejected');
          } else {
            this.notifier.notify('error', result.responseMessage || 'Failed to reject announcement');
          }
        },
        error: (error: any) => {
          this.notifier.notify('error', 'Failed to reject announcement');
          console.error('Error rejecting announcement:', error);
        }
      });
  }

  private async enhanceRegistrationsWithDisplayNames(): Promise<void> {
    try {
      
      // Load regulation details if not already loaded
      if (!this.regulations || this.regulations.length === 0) {
        await this.loadRegulations();
      }

      // Enhance each registration with display name
      for (const registration of this._registrations) {
        if (registration && !registration.displayName) {
          const regulationName = await this.getRegulationNameFromRegistration(registration);
          
          // Create display name: "Registration - Regulation Name"
          let displayName = 'Registration';
          if (regulationName && regulationName.trim() !== '') {
            displayName = `Registration - ${regulationName}`;
          }
          
          registration.displayName = displayName;
         
        }
      }
      
    } catch (error) {
      console.error('Error enhancing registrations with display names:', error);
    }
  }

  private async loadRegulations(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.regulationSetupService.getRegulationSetupDetails().subscribe({
        next: (regulations: any) => {
          this.regulations = regulations || [];
          resolve();
        },
        error: (error: any) => {
          console.error('Error loading regulations:', error);
          this.regulations = [];
          reject(error);
        }
      });
    });
  }

  private loadRegistrationsForDropdown(): void {
    this.regulationSetupService.getAllRegisteration().subscribe({
      next: async (registrations: any) => {
        this.registrations = registrations || [];
        
        // Enhance with display names
        if (this.registrations.length > 0) {
          await this.enhanceRegistrationsWithDisplayNames();
        }
      },
      error: (error: any) => {
        console.error('Error loading registrations for dropdown:', error);
        this.registrations = [];
      }
    });
  }

  private enhanceTocDuesWithDisplayNames(): void {
    try {
      this._tocDues.forEach(tocDue => {
        if (tocDue && !tocDue.displayName) {
          if (tocDue.tocRuleType && tocDue.regulationName) {
            tocDue.displayName = `${tocDue.tocRuleType} - ${tocDue.regulationName}`;
          } else if (tocDue.tocRuleType && tocDue.complianceName) {
            
            tocDue.displayName = `${tocDue.tocRuleType} - ${tocDue.complianceName}`;
          } else if (tocDue.ruleType && tocDue.regulationName) {
            tocDue.displayName = `${tocDue.ruleType} - ${tocDue.regulationName}`;
          } else if (tocDue.ruleType && tocDue.complianceName) {
            tocDue.displayName = `${tocDue.ruleType} - ${tocDue.complianceName}`;
          } else if (tocDue.typeOfComplianceName) {
            tocDue.displayName = tocDue.typeOfComplianceName;
          } else {
            tocDue.displayName = tocDue.ruleType || tocDue.tocRuleType || 'TOC';
          }
        
        }
      });
      
    } catch (error) {
      console.error('Error enhancing TOC dues with display names:', error);
    }
  }

  private ensurePreselection() {
    if (this.selectionType === 'registration' && this.selectedRegistrationId && this.registrations?.length > 0) {

        const currentValue = this.formgroup.get('registerId')?.value;
        
        if (!currentValue || currentValue !== this.selectedRegistrationId) {
          this.formgroup.get('registerId')?.setValue(this.selectedRegistrationId);
          this.formgroup.get('registerId')?.updateValueAndValidity();
          

        }
    }
  }
}