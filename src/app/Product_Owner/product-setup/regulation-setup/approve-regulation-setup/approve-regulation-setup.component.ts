import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'angular-notifier';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';

@Component({
  selector: 'app-regulation-setup-approval',
  templateUrl: './approve-regulation-setup.component.html',
  styleUrls: ['./approve-regulation-setup.component.scss']
})
export class ApproveRegulationSetupComponent {

  constructor(private modalService: NgbModal, private regulationsetupservice: RegulationSetupService,private notifier: NotifierService){}

  @Input()
  modal: any;

  @Output()
  openRegulationSetupReview: EventEmitter<any> = new EventEmitter<any>()
}
