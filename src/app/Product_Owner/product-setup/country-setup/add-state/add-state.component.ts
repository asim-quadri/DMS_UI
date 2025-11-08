import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { th } from 'date-fns/locale';
import { CountryModel, StatesModel } from 'src/app/Models/countryModel';
import { CountryService } from 'src/app/Services/country.service';
import { PersistenceService } from 'src/app/Services/persistence.service';

@Component({
  selector: 'app-add-state',
  templateUrl: './add-state.component.html',
  styleUrls: ['./add-state.component.scss'],
})
export class AddStateComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    public countryService: CountryService,
    private notifier: NotifierService,
    private persistance: PersistenceService
  ) {}
  ngOnInit(): void {
    this.getCountries();
  }
  @Input()
  modal: any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  countries: CountryModel[] = [];
  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [''],
    stateReferenceCode: [''],
    countryId: [
      '',
      [RxwebValidators.required({ message: 'States name is required' })],
    ],
    stateCode: [
      '',
      RxwebValidators.required({ message: 'State Code is required' }),
    ],
    stateName: [
      '',
      RxwebValidators.required({ message: 'State Name is required' }),
    ],
  });

  getCountries() {
    const userId = this.persistance.getUserId()!;
    this.countryService.getAllCountryMaster(userId).subscribe((result: any) => {
      this.countries = result;
    });
  }

  onSubmit() {
    if (this.formgroup.valid) {
      var States: StatesModel = { ...this.formgroup.value };
      States.createdBy = this.persistance.getUserId()!;
      States.managerId = this.persistance.getManagerId()!;
      if (States.id == 0 || States.id == null) {
        States.id = 0;
        States.uid = null;
      }
      States.stateReferenceCode = this.formgroup.get('stateReferenceCode')?.value;
      this.countryService.postState(States).subscribe({
        next: (result: StatesModel) => {
          if (result.responseCode == 1) {
            this.notifier.notify('success', result.responseMessage);
            this.reloaddata.emit('reload');
            this.formgroup.reset();
          } else {
            this.notifier.notify('error', result.responseMessage);
          }
        },
        error: (error) => {
          this.notifier.notify('error', 'Some thing went wrong');
        },
      });
    }
  }
  ngAfterViewInit() {
    this.getLastStateIndex();
  }
  getLastStateIndex() {
    this.countryService.getLastStateIndex().subscribe({
      next: (result: number) => {
        if (result != null) {
          this.formgroup.get('stateReferenceCode')?.setValue(result);
        } else {
          this.formgroup.get('stateReferenceCode')?.setValue('');
        }
        this.formgroup.get('stateReferenceCode')?.disable();
      },
      error: (error) => {
        console.error('Error fetching last state index:', error);
      },
    });
  }
}
