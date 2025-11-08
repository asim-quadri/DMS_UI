import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { BranchModel } from 'src/app/Models/branchModel';
import { BranchService } from 'src/app/Services/branch.service';
import { PersistenceService } from 'src/app/Services/persistence.service';

@Component({
  selector: 'app-add-branch-setup',
  templateUrl: './add-branch-setup.component.html',
  styleUrls: ['./add-branch-setup.component.scss']
})
export class AddBranchSetupComponent {
  constructor(private fb: FormBuilder, private notifier: NotifierService, private persistance: PersistenceService,private branchService: BranchService) {}

  @Input()
  modal:any;

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();

  branch: BranchModel[] = [];

  formgroup: FormGroup = this.fb.group({
    uid: [''],
    tOBReferenceCode: [''],
    id: [''],
    tobName: ['', RxwebValidators.required({ message: 'Type Of Branch is required' }),],
  });

  onSubmit() {
    if (this.formgroup.valid) {
      var branch: BranchModel = { ... this.formgroup.value };
      branch.createdBy = this.persistance.getUserId()!;
      branch.managerId = this.persistance.getManagerId()!;
      if(branch.id == 0 || branch.id == null){
        branch.id=0;
        branch.uid =null;
      }
      branch.tOBReferenceCode = this.formgroup.get('tOBReferenceCode')?.value;
      // if (this.currentApprovalRecord) {
      //   majorIndustry.ApprovalUID = this.currentApprovalRecord.uid!;
      // }
      branch.createdBy = this.persistance.getUserId()!;
      branch.approvalManagerId = this.persistance.getManagerId();
      this.branchService.postBranch(branch).subscribe((result: BranchModel) => {
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
  ngAfterViewInit() {
      this.getNextTOBCode();
    
  }

  getNextTOBCode() {
    try {
      this.branchService.getNextTOBCode().subscribe(
        (nextCode: string) => {
          this.formgroup.get('tOBReferenceCode')?.setValue(nextCode);
          this.formgroup.get('tOBReferenceCode')?.disable();
        },
        error => {
          console.error('Error fetching next TOB code:', error);
        }
      );
    } catch (error) {
      console.error('Exception in getNextTOBCode:', error);
    }
  }
}
