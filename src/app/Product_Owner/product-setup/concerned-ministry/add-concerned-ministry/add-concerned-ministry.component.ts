import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { postConcernedMinistry } from 'src/app/Models/postConcernedMinistry';
import { BaseResult } from 'src/app/Product_Owner/client/service-request/ServiceRequest';
import { ConcernedMinistryService } from 'src/app/Services/concerned-ministry.service';
import { PersistenceService } from 'src/app/Services/persistence.service';

@Component({
  selector: 'app-add-concerned-ministry',
  templateUrl: './add-concerned-ministry.component.html',
  styleUrls: ['./add-concerned-ministry.component.scss']
})
export class AddConcernedMinistryComponent implements AfterViewInit {

 @Input()
  modal: any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  constructor(private fb: FormBuilder, private notifier: NotifierService,private concernedMinistryService:ConcernedMinistryService, private persistence: PersistenceService) {

  }

  formgroup: FormGroup = this.fb.group({
    uid: [null],
    id: [null],
    concernedMinistryReferenceCode: [''],
    concernedMinistryName : ['', [
      RxwebValidators.required({ message: 'Concerned Ministry Name is required' })
    ]],
    concernedMinistryCode: ['', RxwebValidators.required({ message: 'Concerned Ministry Code is required' })],
  });

  onSubmit() {
    try {
      if (this.formgroup.valid) {
        var concernedMinistry: postConcernedMinistry = { ...this.formgroup.value };
        concernedMinistry.createdBy = this.persistence.getUserId()!;
        concernedMinistry.managerId = this.persistence.getManagerId()!;
        if (concernedMinistry.id == 0 || concernedMinistry.id == null) {
          concernedMinistry.id = 0;
          concernedMinistry.uid = '';
        }
        concernedMinistry.concernedMinistryReferenceCode = this.formgroup.get('concernedMinistryReferenceCode')?.value;
        concernedMinistry.status = 0;
        concernedMinistry.createdOn = new Date();
        
        this.concernedMinistryService.postConcernedMinistry(concernedMinistry).subscribe((result: BaseResult) => {
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
      console.error('concernedMinistry:-Exception in onSubmit:', error);
    }
  }
   ngAfterViewInit(): void {
    
    this.getNextConcernedMinistryRefCode();
  }
  getNextConcernedMinistryRefCode() {
    try {
      this.concernedMinistryService.getNextConcernedMinistryRefCode().subscribe((result: string) => {
        this.formgroup.patchValue({
          concernedMinistryReferenceCode: result
        });
        this.formgroup.updateValueAndValidity();
        this.formgroup.get('concernedMinistryReferenceCode')?.disable();
      }, error => {
        console.error('Error fetching next Concerned Ministry reference code:', error);
       
      });
    } catch (error) {
      console.error('Exception in getNextConcernedMinistryRefCode:', error);
   
    }
  }
}
