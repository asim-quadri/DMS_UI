import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NotifierService } from 'angular-notifier';
import { TOC, TOCRegistration } from 'src/app/Models/TOC';
import { TOCListModel } from 'src/app/Models/regulationsetupModel';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';

@Component({
  selector: 'app-toc-setup',
  templateUrl: './toc-setup.component.html',
  styleUrls: ['./toc-setup.component.scss']
})
export class TocSetupComponent {
  active: number = 1;
  tocModel: TOC = {};
  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();
  @Input()
  RegTOC: TOCListModel | undefined;
  @Input()
  ActionType: any;

  @Input()
  complianceId: number | undefined;

  @Input()
  ParentComplianceName: any | undefined;

  @Input()
  regulationSetupId: number | undefined;

  @Input()
  regulationSetupName: any | undefined;

  @Input()
  regulationSetupUID: any;
  @Input()
  isParameterChecked: boolean = false;

  constructor() {

  }

  changeTab(event: any) {
    this.active = event;
  }

  UpdateTOCModel(toc: TOC) {
    this.tocModel = toc;
  }

  reload(event:any){
    this.reloaddata.emit(event);
  }

}
