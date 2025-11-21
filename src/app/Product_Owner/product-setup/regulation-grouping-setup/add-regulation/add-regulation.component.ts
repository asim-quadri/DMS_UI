import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { RegulationGroupModel } from 'src/app/Models/regulationGroupModel';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationGroupService } from 'src/app/Services/regulation.service';

@Component({
  selector: 'app-add-regulation',
  templateUrl: './add-regulation.component.html',
  styleUrls: ['./add-regulation.component.scss'],
})
export class AddRegulationComponent {
  @Input()
  modal: any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private fb: FormBuilder,
    private notifier: NotifierService,
    private regulationGpService: RegulationGroupService,
    private persistance: PersistenceService
  ) {}
  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [''],
    regulationGroupReferenceCode: [''],
    regulationGroupName: [
      '',
      [
        RxwebValidators.required({
          message: 'Regulation Group name is required',
        }),
      ],
    ],
    regulationGroupCode: [
      '',
      RxwebValidators.required({
        message: 'Regulation Group Code is required',
      }),
    ],
  });

  onSubmit() {
    if (this.formgroup.valid) {
      var regulation: RegulationGroupModel = { ...this.formgroup.value };
      regulation.createdBy = this.persistance.getUserId()!;
      regulation.managerId = this.persistance.getManagerId()!;
      if (regulation.id == 0 || regulation.id == null) {
        regulation.id = 0;
        regulation.uid = null;
      }
      regulation.regulationGroupReferenceCode = this.formgroup.get('regulationGroupReferenceCode')?.value;
      this.regulationGpService.postRegulationGroup(regulation).subscribe(
        (result: RegulationGroupModel) => {
          if (result.responseCode == 1) {
            this.notifier.notify('success', result.responseMessage);
            this.reloaddata.emit('reload');
            this.formgroup.reset();
          } else {
            this.notifier.notify('error', result.responseMessage);
          }
        },
        (error) => {
          this.notifier.notify('error', 'Some thing went wrong');
        }
      );
    }
  }
  generateRefCode(event: any) {
    const name = event.target.value;
    const firstThree = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const nextCode = this.formgroup.get('regulationGroupReferenceCode')?.value || '';
    const firstNumberMatch = nextCode.match(/\d+/);
    const firstNumber = firstNumberMatch ? firstNumberMatch[0] : '';
    const refCode = `${firstThree}${firstNumber}`;
    this.formgroup.get('regulationGroupReferenceCode')?.setValue(refCode);
    this.formgroup.get('regulationGroupReferenceCode')?.disable();
  }

  ngAfterViewInit() {
    this.getNextRegulationGroupCode();
  }
  async getNextRegulationGroupCode() {
    try {
      this.regulationGpService
        .getNextRegulationGroupCode()
        .subscribe((nextCode: string) => {
          this.formgroup.get('regulationGroupReferenceCode')?.setValue(nextCode);
          this.formgroup.get('regulationGroupReferenceCode')?.disable();
        });
    } catch (err) {
      console.error('error', 'An unexpected error occurred');
    }
  }
}
