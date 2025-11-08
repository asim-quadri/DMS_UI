import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IndustryService } from '../../../../Services/industry.service';
import { NotifierService } from 'angular-notifier';
import { PersistenceService } from '../../../../Services/persistence.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CountryMajorApproval, MajorIndustryModel, MinorIndustrypModel } from '../../../../Models/industrysetupModel';
import { RxwebValidators, error } from '@rxweb/reactive-form-validators';
import { CountryModel } from '../../../../Models/countryModel';
import { CountryService } from '../../../../Services/country.service';

@Component({
  selector: 'app-add-major-industry',
  templateUrl: './add-major-industry.component.html',
  styleUrls: ['./add-major-industry.component.scss']
})
export class AddMajorIndustryComponent {
  constructor(private fb: FormBuilder, public industryService: IndustryService, private notifier: NotifierService, private persistance: PersistenceService,
     public countryService: CountryService) {}

  currentApprovalRecord: CountryMajorApproval | undefined;

  @Input()
  modal:any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  minorIndustries: MinorIndustrypModel[] = [];
  countries:CountryModel[] = [];

  ngOnInit() {
    this.getCountries();
  }

  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [''],
    majorIndustryReferenceCode: [''],
    majorIndustryCode: ['', [
       RxwebValidators.required({ message: 'Major Industry Code is required' }),
       RxwebValidators.alpha({ message: "Major Industry Code contain only characters" })
    ]],
    majorIndustryName: ['', RxwebValidators.required({ message: 'Major Industry Name is required' }),]
    ,
  });

  getCountries() {
    this.countryService.getAllCountries().subscribe((result: any) => {
			this.countries = result;
		});
  }

  onSubmit() {
    if (this.formgroup.valid) {
      var majorIndustry: MajorIndustryModel = { ... this.formgroup.value };
      majorIndustry.createdBy = this.persistance.getUserId()!;
      majorIndustry.managerId = this.persistance.getManagerId()!;
      if(majorIndustry.id == 0 || majorIndustry.id == null){
        majorIndustry.id=0;
        majorIndustry.uid =null;
      }
      if (this.currentApprovalRecord) {
        majorIndustry.ApprovalUID = this.currentApprovalRecord.uid!;
      }
      this.industryService.postMajorIndustry(majorIndustry).subscribe((result: MajorIndustryModel) => {
        if(result.responseCode == 1){
          this.notifier.notify("success", result.responseMessage);
          this.reloaddata.emit('reload');
          this.formgroup.reset();
        }
        else{
          this.notifier.notify("error", result.responseMessage)
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
      const result = await this.countryService.getNextMajorIndustryCode().toPromise();
        this.formgroup.get('majorIndustryReferenceCode')?.setValue(result);
        this.formgroup.get('majorIndustryReferenceCode')?.disable();
      
    } catch (error) {
      console.error('Error fetching next Major Industry Code', error);
    }
  }
}
