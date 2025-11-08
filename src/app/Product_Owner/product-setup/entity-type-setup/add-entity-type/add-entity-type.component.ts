import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { EntityTypeModel } from 'src/app/Models/entityTypeModel';
import { EntityTypeService } from 'src/app/Services/entityType.service';
import { PersistenceService } from 'src/app/Services/persistence.service';


@Component({
  selector: 'app-add-entity-type',
  templateUrl: './add-entity-type.component.html',
  styleUrls: ['./add-entity-type.component.scss']
})
export class AddEntityTypeComponent {
  @Input()
  modal: any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  constructor(private fb: FormBuilder, private notifier: NotifierService,private entityTypeService:EntityTypeService, private persistance: PersistenceService) {

  }
  formgroup: FormGroup = this.fb.group({
    uid: [''],
    id: [''],
    entityTypeReferenceCode: [''],
    entityType: ['', [
      RxwebValidators.required({ message: 'Entity Type Name is required' })
    ]],
    entityTypeCode: ['', RxwebValidators.required({ message: 'EntityType Code is required' })],
  });

  onSubmit() {

    if (this.formgroup.valid) {
      var entityType: EntityTypeModel = { ... this.formgroup.value };
      entityType.createdBy = this.persistance.getUserId()!;
      entityType.managerId = this.persistance.getManagerId()!;
      if(entityType.id == 0 || entityType.id == null){
        entityType.id=0;
        entityType.uid =null;
      }
      entityType.entityTypeReferenceCode = this.formgroup.get('entityTypeReferenceCode')?.value;
      this.entityTypeService.postEntityType(entityType).subscribe((result: EntityTypeModel) => {
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
  ngAfterViewInit(): void {
    this.getNextEntityTypeReferenceCode();
  }
  getNextEntityTypeReferenceCode() {
    try {
      this.entityTypeService.getNextEntityTypeReferenceCode().subscribe({
        next: (result: string) => {
          this.formgroup.get('entityTypeReferenceCode')?.setValue(result);
          this.formgroup.get('entityTypeReferenceCode')?.disable();
        },
        error: (error) => {
          console.error('Error fetching next entity type reference code:', error);
        }
      });
    } catch (err) {
      console.error('Exception in getNextEntityTypeReferenceCode:', err);
    }
  }
}
