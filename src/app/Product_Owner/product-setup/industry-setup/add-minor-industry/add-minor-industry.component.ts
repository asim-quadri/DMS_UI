import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NotifierService } from 'angular-notifier';
import { IndustryService } from '../../../../Services/industry.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PersistenceService } from '../../../../Services/persistence.service';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { MajorIndustryModel, MajorMinorIndustryApproval, MinorIndustrypModel } from '../../../../Models/industrysetupModel';

@Component({
  selector: 'app-add-minor-industry',
  templateUrl: './add-minor-industry.component.html',
  styleUrls: ['./add-minor-industry.component.scss']
})
export class AddMinorIndustryComponent {
  constructor(private fb: FormBuilder, public industryService: IndustryService, private notifier: NotifierService, private persistance: PersistenceService) {}

  ngOnInit(): void {
    this.getAllMajorIndustries();
  }
  
  currentApprovalRecord: MajorMinorIndustryApproval | undefined;

  @Input()
  modal:any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  majorIndustries: MajorIndustryModel[] = [];
  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [''],
    majorIndustryId: [''],
    minorIndustryReferenceCode: [''],
    minorIndustryCode: ['', [
      RxwebValidators.required({ message: 'Minor Industry Code is required' }),
      RxwebValidators.alpha({ message: "Minor Industry Code contain only characters" })
    ]],
    minorIndustryName: ['', RxwebValidators.required({ message: 'Minor Industry Name is required' })],
  });

  getAllMajorIndustries() {
    this.industryService.getAllMajorIndustries().subscribe((result: any) => {
      this.majorIndustries = result;
    });
  }

  onSubmit() {
    if (this.formgroup.valid) {
      var minorIndustry: MinorIndustrypModel = { ... this.formgroup.value };
      minorIndustry.createdBy = this.persistance.getUserId()!;
      minorIndustry.managerId = this.persistance.getManagerId()!;
      if(minorIndustry.id == 0 || minorIndustry.id == null){
        minorIndustry.id=0;
        minorIndustry.uid =null;
      }
      if (this.currentApprovalRecord) {
        minorIndustry.ApprovalUID = this.currentApprovalRecord.uid!;
      }
      minorIndustry.minorIndustryReferenceCode = this.formgroup.get('minorIndustryReferenceCode')?.value || '';
      this.industryService.postMinorIndustry(minorIndustry).subscribe((result: MinorIndustrypModel) => {
        if(result.responseCode == 1){
        this.notifier.notify("success", result.responseMessage);
        this.reloaddata.emit('reload');
        this.formgroup.reset();
        }
        else{
          this.notifier.notify("error", result.responseMessage);
        }

      }, error => {
        this.notifier.notify("error", "Some thing went wrong");
      });
    }
  }
   async ngAfterViewInit() {
    await this.getNextMajorIndustryCode();
  }
  async getNextMajorIndustryCode() {
    try {
      const result = await this.industryService.getNextMinorIndustryCode().toPromise();
        this.formgroup.get('minorIndustryReferenceCode')?.setValue(result);
        this.formgroup.get('minorIndustryReferenceCode')?.disable();
      
    } catch (error) {
      console.error('Error fetching next Major Industry Code', error);
    }
    
  }
}
