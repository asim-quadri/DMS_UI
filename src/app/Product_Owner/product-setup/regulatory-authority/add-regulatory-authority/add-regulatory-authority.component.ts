import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { PostRegulatoryAuthorities } from 'src/app/Models/postRegulatoryAuthorities';
import { BaseResult } from 'src/app/Product_Owner/client/service-request/ServiceRequest';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulatoryAuthorityService } from 'src/app/Services/regulatory-authorities.service';

@Component({
  selector: 'app-add-regulatory-authority',
  templateUrl: './add-regulatory-authority.component.html',
  styleUrls: ['./add-regulatory-authority.component.scss']
})
export class AddRegulatoryAuthorityComponent implements OnInit {

 @Input()
  modal: any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  constructor(private fb: FormBuilder, private notifier: NotifierService,private regulatoryAuthService:RegulatoryAuthorityService, private persistance: PersistenceService) {

  }
  ngOnInit(): void {
    // Initialization logic if needed
  }
  formgroup: FormGroup = this.fb.group({
    uid: [null],
    id: [null],
    regulatoryAuthorityReferenceCode: [''],
    regulatoryAuthorityName : ['', [
      RxwebValidators.required({ message: 'Regulatory Authority  Name is required' })
    ]],
    regulatoryAuthorityCode: ['', RxwebValidators.required({ message: 'Regulatory Authority Code is required' })],
  });
  onSubmit() {
    try {
      if (this.formgroup.valid) {
        var regulatoryAuthority: PostRegulatoryAuthorities = { ...this.formgroup.value };
        regulatoryAuthority.createdBy = this.persistance.getUserId()!;
        regulatoryAuthority.managerId = this.persistance.getManagerId()!;
        if (regulatoryAuthority.id == 0 || regulatoryAuthority.id == null) {
          regulatoryAuthority.id = 0;
          regulatoryAuthority.uid = '';
        }
        regulatoryAuthority.regulatoryAuthorityReferenceCode = this.formgroup.get('regulatoryAuthorityReferenceCode')?.value;
        regulatoryAuthority.status = 0;
        regulatoryAuthority.CreatedOn = new Date();
        
        this.regulatoryAuthService.postRegulatoryAuthority(regulatoryAuthority).subscribe((result: BaseResult) => {
          if (result.success) {
            this.notifier.notify("success", result.message);
            this.reloaddata.emit('reload');
            this.formgroup.reset();
          } else {
            this.notifier.notify("error", result.message);
          }
        }, error => {
          this.notifier.notify("error", "Some thing went wrong");
        });
      }
    } catch (error) {
      this.notifier.notify("error", "An unexpected error occurred.");
      console.error('Exception in onSubmit:', error);
    }
  }
  ngAfterViewInit(): void {
    
    this.getNextRegulatoryAuthRefCode();
  }
  getNextRegulatoryAuthRefCode() {
    try {
      this.regulatoryAuthService.getNextRegulatoryAuthRefCode().subscribe((result: string) => {
        console.log('Next Regulatory Authority Reference Code:', result);
        this.formgroup.patchValue({
          regulatoryAuthorityReferenceCode: result
        });
        this.formgroup.updateValueAndValidity();
        this.formgroup.get('regulatoryAuthorityReferenceCode')?.disable();
      }, error => {
        console.error('Error fetching next regulatory authority reference code:', error);
       
      });
    } catch (error) {
      console.error('Exception in getNextRegulatoryAuthRefCode:', error);
   
    }
  }
}

