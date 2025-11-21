import { Component, ElementRef, EventEmitter, HostListener, Input, numberAttribute, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ModalDismissReasons, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotifierService } from 'angular-notifier';
import { CountryService } from 'src/app/Services/country.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { compliancetracker, ComplianceTrackerModel } from 'src/app/Models/compliancetracker';
import { IndustryMapping } from 'src/app/Models/industrysetupModel';
import { RegulationGroupModel } from 'src/app/Models/regulationGroupModel';
import { RegulationGroupService } from 'src/app/Services/regulation.service';
import { EntityTypeModel } from 'src/app/Models/entityTypeModel';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { ComplianceListModle, RegulationSetupDetailsModel, ReuglationListModle, TOCListModel } from 'src/app/Models/regulationsetupModel';
import { pendingApproval } from 'src/app/Models/pendingapproval';
import { GridApi } from 'ag-grid-community';
import { AgbuttonComponent } from 'src/app/Components/ag-grid/agbutton/agbutton.component';
import { CompliancetrackerService } from 'src/app/Services/compliancetracker.service';
import { any, result, values } from 'underscore';
import { EntityModel } from 'src/app/Models/entityModel';
import { EntityModule } from 'src/app/Product_Owner/product-setup/entity/entity.module';
import { elementAt, from, race, Subject, Subscription } from 'rxjs';
import { date, grid, numeric } from '@rxweb/reactive-form-validators';
import { end } from '@popperjs/core';
import { tr } from 'date-fns/locale';
import { formatDate } from '@angular/common';


const defaultColumnDef = {
  editable: false,
  resizable: true,
  wrapText: true,
  autoHeight: true,
  sortable: true,
  angularCompileHeaders: true,
};


@Component({
  selector: 'app-compliance-tracker-list',
  templateUrl: './compliance-tracker-list.component.html',
  styleUrls: ['./compliance-tracker-list.component.scss']
})
export class ComplianceTrackerListComponent implements OnInit {
  contextMenuPosition = { x: '0px', y: '0px' };
  showContextMenu = false;
  contextMenuTarget: any;

  expandedRegulations = new Set<number>();
  expandedCompliances = new Set<number>();
  expandedRegulationSetup = new Set<number>();

  @Output()
  listitemchange: EventEmitter<any> = new EventEmitter<any>();


  @ViewChild('addRegulationSetupApporoval') addRegulationSetupApporoval: any;
  pendingApproval: pendingApproval | undefined;
  @ViewChild('agGrid') agGrid: any;
  active = 6;
  @Input() resetFormSubject: Subject<boolean> = new Subject<boolean>();


  disabled = true;
  showDiv: boolean = false;
  closeResult = '';
  defaultColumnDef = defaultColumnDef;
  private api: GridApi | undefined;
  columnDefs = [
    { headerName: 'id', field: 'id', hide: true },
    { headerName: 'uid', field: 'uid', hide: true },
    { headerName: 'For the Month', field: 'forTheMonth', width: 130 },
    {
      headerName: 'Due Date', field: 'dueDate', width: 100, cellRenderer: (data: { value: Date; }) => {
        return data.value ? (new Date(data.value)).toLocaleDateString() : '';
      }
    },
    { headerName: 'Due Amount', field: 'dueAmount', width: 120 },
    { headerName: 'Amount Paid', field: 'amountPaid', width: 120 },
    {
      headerName: 'Actual Date', field: 'actualDate', width: 100, cellRenderer: (data: { value: Date; }) => {
        return data.value ? (new Date(data.value)).toLocaleDateString() : '';
      }
    },
    { headerName: 'Payable Amount', field: 'payableAmount', width: 150 },
    { headerName: 'Reason', field: 'reason', width: 150 },
    {
      headerName: 'Status',
      field: 'dummystatus',
      width: 100,
      cellRenderer: AgbuttonComponent,
    },
    // {
    //   headerName: 'Control',
    //   field: 'Control',
    //   width: 150,
    //   cellRenderer: AgbuttonComponent,
    //   cellRendererParams: {
    //     clicked: (field: any) => {
    //       if (field.data.status == 1) {
    //         this.regulationSetupModel = { ...field.data };
    //         this.pendingApproval = { userUID: this.regulationSetupModel.uid! };
    //       }
    //     },
    //   },
    // },
  ];
  complianceId: any;
  complianceName: any;
  regulationId: any;

  regulationSetupName: any;
  entity: EntityModel | undefined;
  entityid: Number | undefined;
  optionSelected: any;
  entityList: any[] = [];
  entitySelected: any;
  selectedChildOption: string | undefined;
  persistance: any;

  ngOnInit() {
    this.getEntities();
    this.entityid = Number(localStorage.getItem('EntityId'));
    // this.getEntityById(this.entityid);
    this.getRegulationGroupSetup();
    // this.getRegulationComplianceByEntityId(Number(this.entityid));
    this.getHistoryRegulationSetup();
    this.complianceTrackerService.childOptions$.subscribe(options => {
      this.entityid = Number(localStorage.getItem('EntityId'));
      if (options != undefined && options.length > 0) {
        var yearSplit = options[0].year.split('-');
        var monthSplit = options[0].month.split('-');
        this.financialStart = yearSplit[0];
        this.financialEnd = yearSplit[1];
        this.fromMonth = monthSplit[0];
        this.toMonth = monthSplit[1];
        this.finYearList = options;
        this.getRegulationComplianceByEntityId(Number(this.entityid));
      }
    });
    this.complianceTrackerService.gridSubject$.subscribe(result => {
      // this.rowData = res;
      // console.log('grid load', result);
      if (result != undefined && result.length > 0) {

        var res = [];
        result.forEach((reg: any) => {
          reg.compliance.forEach((comp: any) => {
            //this.allCompliances.push(reg);
            this.getAllCompliances(reg.compliance);
            // console.log(comp, this.allCompliances);
          });
        });
        this.RegulationComplianceTrackerDetails = result;
        var lstCompTrackers = this.RegulationComplianceTrackerDetails[0].complianceTrackers;
        // var grdData = new Array<ComplianceTrackerModel>();
        this.BindGrid(lstCompTrackers);
      }
    });

  }
  onChildDropdownChange(selectedValue: any) {
    this.finYearList = selectedValue;
  }
  onGridReady(params: any): void {
    this.api = params.api;
  }

  rowData: any[] = [];
  RegulationComplianceTrackerDetails: any[] = [];
  selectedRegulationName: string | undefined = "";
  selectedComplianceName: string | undefined = "";
  rowdt: any[] = [];
  allCompliances: any[] = [];
  finYearList: any[] = [];

  // countryStateMapping: CountryStateMapping[] = [];
  regulationGroupList: RegulationGroupModel[] = [];
  industryMapping: IndustryMapping[] = [];
  countryRegulationMapping: RegulationGroupModel[] = [];
  countryEntityTypeMapping: EntityTypeModel[] = [];
  regulationSetup: ReuglationListModle[] = [];
  compliacetrackerList: compliancetracker[] = [];
  regulationAllSetup: RegulationSetupDetailsModel[] = [];
  regulationSetupModel: RegulationSetupDetailsModel = {};
  stateList = [];
  currentComponent = 'compliance-tracker'
  @ViewChild("RegComplianceReview") RegComplianceReview: any;
  @ViewChild("TOCRegistration") TOCRegistration: any;
  @ViewChild("TOCRules") TOCRules: any;
  @ViewChild("RegulationSetupReview") RegulationSetupReview: any;
  RegComplianceUID: any;
  RegulationSetupUID: any | undefined;
  approverUID: any;

  regulationSetupScreen: boolean = true;
  RegTOC: TOCListModel | undefined;

  tocRegistrationHistory: any;
  tocRulesHistory: any;

  ActionType = 'Edit';

  isYearSelected: boolean | false | undefined;

  protected subscription: Subscription | undefined;
  constructor(private modalService: NgbModal, private fb: FormBuilder,
    public regulationSetupService: RegulationSetupService, public countryService: CountryService,
    public complianceTrackerService: CompliancetrackerService, private notifier: NotifierService,) {
    //this.ShowCompliance();
    //this.ShowTOC();
    // this.ShowRegulationSetup();
    this.finYearList = [];
  }

  formgroup: FormGroup = this.fb.group({
    countryId: ['', Validators.required],
    stateId: ['', Validators.required],
    regulationType: ['', Validators.required],
    regulationName: ['', Validators.required],
    regulationGroupId: ['', Validators.required],
    description: ['', Validators.required],
    entityId: ['', Validators.required],
    entitydd: ['']
  });


  getEntities() {
    this.complianceTrackerService.getEntities().subscribe({
      next: (result: any) => {
        this.entityList = result;
      },
      error: (error: any) => {
        console.log(error);
      }
    });
  }

  onEntityChange(event: any) {
    const selectedValue = event.target.value;
    if (selectedValue != undefined) {
      var value = selectedValue.split(':')[1];
      localStorage.setItem('EntityName', event.target.selectedOptions[0].text)
      localStorage.setItem('EntityId', event.target.selectedIndex)
      // console.log(this.complist);
      // this.resetFormSubject.next(true);
      // this.complist?.getEntityById(event.target.selectedIndex);
      this.getEntityById(value);
    }
  }

  onMenuItemClick(action: string) {

    console.log('onMenuItemClick');
    this.currentComponent = '';
    if (action == "Compliance") {
      setTimeout(() => {
        this.ShowCompliance();
      }, 500);


    }
    else if (action == "Type of Compliance") {
      setTimeout(() => {
        this.ShowTOC();
      }, 500);

    }
    else if (action == "RegulationSetup") {
      setTimeout(() => {
        this.ShowRegulationSetup();
      }, 500)
    }
    this.ActionType = "Create";
    this.showContextMenu = false;
    console.log(action, this.contextMenuTarget);
    // Perform the desired action based on the clicked menu item
  }


  toggleCompliance(compliance: ComplianceListModle) {
    console.log('toggleCompliance', compliance)
    this.rowData = [];
    this.rowdt = [];
    this.selectedComplianceName = compliance.complianceName?.toString();
    this.currentComponent = '';
    if (this.expandedCompliances.has(compliance.id!)) {
      this.expandedCompliances.delete(compliance.id!);
    } else {
      this.expandedCompliances.add(compliance.id!);
    }
    this.complianceId = compliance.id;
    this.regulationId = null;
    this.RegComplianceUID = compliance.complianceUID!;
    this.ActionType = "Edit";
    this.allCompliances.filter((comp: any) => comp.complianceName == compliance.complianceName).forEach(comp => {

      if (comp.complianceTrackers != undefined && comp.complianceTrackers.length > 0) {
        // return e.complianceTrackers;
        // comp.complianceTrackers.forEach((itm: any) => {
        //   this.rowdt.push(itm);
        this.BindGrid(comp.complianceTrackers);
        // });
      }
    });
    // console.log(this.rowdt);
    // this.rowData = this.rowdt;
    setTimeout(() => {
      this.ShowCompliance();
    }, 500);


  }

  @Output() parentFunction = new EventEmitter<string>();

  ngOnChanges(changes: SimpleChanges): void {
    // If the tableData changes, update the columns
    if (changes['rowdata'] && this.RegulationComplianceTrackerDetails.length > 0) {
    }
  }

  toggleTocUnderCompliance(compliance: ComplianceListModle, toc: TOCListModel,) {
    this.currentComponent = '';
    this.complianceId = compliance.id;
    this.regulationId = 0;
    this.RegTOC = toc!;
    setTimeout(() => {
      this.ShowTOC();
    }, 500);

  }

  toggleTocUnderRegulation(compliance: TOCListModel, regulationsetup: ReuglationListModle) {
    console.log('toggleTocUnderRegulation');
    this.currentComponent = '';
    this.complianceId = 0;
    this.regulationId = regulationsetup.id;
    this.RegTOC = compliance!;
    setTimeout(() => {
      this.ShowTOC();
    }, 500);
  }

  OnSubmit(detail: any) {
    // console.log(dueAmount, payableAmount, amountPaid, actualDate, reason);
    console.log('save', detail);
    var trackerModel: ComplianceTrackerModel = detail;
    // trackerModel.DueAmount = Number(dueAmount.value);
    // trackerModel.AmountPaid = Number(amountPaid.value);
    var dateParts = trackerModel.DueDate.split("-");
    var dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);

    // if (actualDate.value != undefined && actualDate.value != '') {
    //   trackerModel.ActualDate = formatDate(new Date(actualDate.value).toLocaleDateString().slice(0, 10), 'yyyy-MM-dd', 'en-US');
    // }
    trackerModel.DueDate = formatDate(new Date(dateObject).toLocaleDateString().slice(0, 10), 'yyyy-MM-dd', 'en-US');
    // trackerModel.PayableAmount = Number(payableAmount.value);
    // trackerModel.Reason = reason.value;
    console.log(trackerModel);
    this.complianceTrackerService.postComplianceTracker(trackerModel).subscribe((result: any) => {
      if (result) {
        this.notifier.notify("success", "Compliance Tracker Inserted Successfully");
        this.formgroup.reset();
      }
      else {
        this.notifier.notify("error", "Something went wrong");
      }
    }, error => {
      this.notifier.notify("error", "Something went wrong");
    });

  }

  isRegulationExpanded(regulationId: number): boolean {
    return this.expandedRegulations.has(regulationId);
  }

  isComplianceExpanded(complianceId: number): boolean {
    return this.expandedCompliances.has(complianceId);
  }

  private onSubject = new Subject<{ key: string | null, value: any }>();
  public changes = this.onSubject.asObservable().pipe();

  toggleRegulation(regulation: ReuglationListModle) {
    this.rowData = [];
    this.rowdt = [];
    this.selectedRegulationName = regulation.regulationName?.toString();
    this.currentComponent = '';
    if (this.expandedRegulations.has(regulation.id!)) {
      this.expandedRegulations.delete(regulation.id!);
    } else {
      this.expandedRegulations.add(regulation.id!);
    }
    this.regulationId = regulation.id;
    this.RegulationSetupUID = regulation.regulationSetupUID;
    this.ActionType = "Edit";
    console.log('complianceTrackers', this.RegulationComplianceTrackerDetails);

    this.RegulationComplianceTrackerDetails.filter(m => m.regulationName == regulation.regulationName).forEach(e => {
      console.log('for each', e);
      if (e.complianceTrackers != undefined && e.complianceTrackers.length > 0) {
        this.BindGrid(e.complianceTrackers);
        // // return e.complianceTrackers;
        // e.complianceTrackers.forEach((itm: any) => {
        //   this.rowdt.push(itm);
        // });
        // console.log('inside if', e.complianceTrackers, this.rowdt);
      }
    });
    console.log(this.rowdt);

    setTimeout(() => {
      this.ShowRegulationSetup();
    })
  }

  grdData: any[] = [];
  BindGrid(compTrackerList: any) {
    this.grdData = [];
    // console.log('bind grid', compTrackerList)
    this.loadedComplianceTracker = compTrackerList;
    var freqMonthly = 12;
    var freqQuarterly = 4;
    var freqHalfly = 2;
    var startYr = this.financialStart;
    var endYr = this.financialEnd;
    var fromMonth = this.fromMonth;
    var toMonth = this.toMonth;
    // console.log('grid dates', startYr, endYr, fromMonth, toMonth);
    var startDt = new Date(Date.parse(fromMonth + "-" + startYr));
    var endDt = new Date(Date.parse(toMonth + "-" + endYr));
    console.log(startDt, endDt);
    compTrackerList.forEach((ct: any) => {
      startDt.setDate(new Date(ct.dueDate).getDate());
      endDt.setDate(new Date(ct.dueDate).getDate());
      startDt.setMonth(startDt.getMonth() - 1);
      if (ct.frequency == "monthly") {
        for (let i = 0; i < freqMonthly; i++) {
          var stDate = startDt;
          stDate.setMonth(stDate.getMonth() + 1);
          if (new Date(stDate.toLocaleDateString()) <= endDt) {
            var formattedDate = formatDate(stDate.toLocaleDateString().slice(0, 10), 'dd-MM-yyyy', 'en-US');
            var formattedmonth = formatDate(stDate.toLocaleDateString().slice(0, 10), 'MM-yyyy', 'en-US');
            // console.log(formattedDate, new Date(formattedDate) <= endDt);
            var model = new ComplianceTrackerModel();
            model.Frequency = ct.frequency;
            model.ForTheMonth = formattedmonth;
            model.ComplianceId = ct.complianceId;
            model.DueDate = formattedDate;
            model.EntityId = this.entityid;
            model.RegulationSetupId = this.regulationId;
            model.ComplianceId = this.complianceId;
            model.DueAmount = ct.dueAmount;
            model.AmountPaid = ct.amountPaid;
            model.ActualDate = ct.actualDate;
            model.PayableAmount = ct.payableAmount;
            model.Reason = ct.reason;
            this.grdData.push(model);
          }
        }

      }
      else if (ct.frequency == "quarterly") {
        for (let i = 0; i < freqQuarterly; i++) {

          var stDate = startDt;
          stDate.setMonth(stDate.getMonth() + 3);
          if (new Date(stDate.toLocaleDateString()) <= endDt) {
            var formattedDate = formatDate(stDate.toLocaleDateString().slice(0, 10), 'dd-MM-yyyy', 'en-US');
            console.log(formattedDate, endDt, new Date(formattedDate), new Date(formattedDate) <= endDt);
            var model = new ComplianceTrackerModel();
            model.Frequency = ct.frequency;
            model.ForTheMonth = ct.forTheMonth;
            model.ComplianceId = ct.complianceId;
            model.DueDate = formattedDate;
            model.EntityId = this.entityid;
            model.RegulationSetupId = this.regulationId;
            model.ComplianceId = this.complianceId;
            model.DueAmount = ct.dueAmount;
            model.AmountPaid = ct.amountPaid;
            model.ActualDate = ct.actualDate;
            model.PayableAmount = ct.payableAmount;
            model.Reason = ct.reason;
            this.grdData.push(model);
          }
          // grdData.push({
          //   frequency: ct.frequency,
          //   forTheMonth: ct.forTheMonth,
          //   // cmpId: ct.complianceId,
          //   dueDate: ct.dueDate
          // });
        }
      }
      else if (ct.frequency == "halfly") {
        for (let i = 0; i < freqHalfly; i++) {
          var stDate = startDt;
          stDate.setMonth(stDate.getMonth() + 6);
          if (new Date(stDate.toLocaleDateString()) <= endDt) {
            var formattedDate = formatDate(stDate.toLocaleDateString().slice(0, 10), 'dd-MM-yyyy', 'en-US');
            console.log(formattedDate, new Date(formattedDate) <= endDt);
            var model = new ComplianceTrackerModel();
            model.Frequency = ct.frequency;
            model.ForTheMonth = ct.forTheMonth;
            model.ComplianceId = ct.complianceId;
            model.DueDate = formattedDate;
            model.EntityId = this.entityid;
            model.RegulationSetupId = this.regulationId;
            model.ComplianceId = this.complianceId;
            model.DueAmount = ct.dueAmount;
            model.AmountPaid = ct.amountPaid;
            model.ActualDate = ct.actualDate;
            model.PayableAmount = ct.payableAmount;
            model.Reason = ct.reason;
            this.grdData.push(model);
          }

          // grdData.push({
          //   frequency: ct.frequency,
          //   forTheMonth: ct.forTheMonth,
          //   // cmpId: ct.complianceId,
          //   dueDate: ct.dueDate
          // });
        }
      }
    });
    // console.log('complianceTrackers', this.RegulationComplianceTrackerDetails);
    console.log('grid data', this.grdData)
    this.rowData = this.grdData; //this.RegulationComplianceTrackerDetails[0].complianceTrackers;
    // this.rowData = compTrackerList;
  }
  financialStart: Number | undefined;
  financialEnd: number | undefined;
  fromMonth: string | undefined;
  toMonth: string | undefined;
  currentYear: Number | undefined;

  listYear: any[] = [];
  public async getEntityById(entityId: any) {
    this.finYearList = [];
    this.listYear = [];
    this.currentYear = new Date().getFullYear();
    this.subscription = this.complianceTrackerService.getEntityById(entityId).subscribe({
      next: (result: any) => {
        // listYear.push({ month: "test", value: "test" });
        if (result.financialYearStart != undefined && result.financialYearEnd != undefined) {

          this.entity = result;
          this.financialStart = result.financialYearStart;
          this.financialEnd = result.financialYearEnd;
          this.fromMonth = result.fromMonth;
          this.toMonth = result.toMonth;
          var finStYr = this.financialStart;
          var finEdYr = this.financialEnd;
          var count = Number(this.currentYear) - Number(finStYr);
          for (let i = 0; i < count; i++) {
            this.listYear.push({ month: this.fromMonth + "-" + this.toMonth, year: finStYr + "-" + finEdYr });
            finStYr = Number(finStYr) + 1;
            finEdYr = Number(finEdYr) + 1;
          }
          console.log(this.financialStart, this.financialEnd, this.financialStart == this.financialEnd);
          if (this.financialStart == this.financialEnd) {

            this.listYear.push({ month: this.fromMonth + "-" + this.toMonth, year: new Date().getFullYear() + "-" + new Date().getFullYear() });
          }
          else {
            // console.log('next year', Number(new Date().getFullYear() + 1))
            this.listYear.push({ month: this.fromMonth + "-" + this.toMonth, year: new Date().getFullYear() + "-" + Number(new Date().getFullYear() + 1) });
          }
        }
      },
      error: (error: any) => {
        console.log(error);
      }
    });
    await new Promise(f => setTimeout(f, 1000));
    for (let i = 0; i < this.listYear.length; i++) {
      this.finYearList.push({ month: this.listYear[i].month, year: this.listYear[i].year });
    }
    // this.finYearList.push({month:"Apr-Mar", year:"2024-2025"});
    // this.finYearList = listYear;
    await new Promise(f => setTimeout(f, 1000));

    this.getRegulationComplianceByEntityId(Number(entityId));

  }

  selectedFrequency: string | null | undefined;
  loadedComplianceTracker: any[] = [];
  onFinYrChange(event: any) {
    const selectedValue = event.target.value;
    var value = selectedValue.split(':')[1];
    if (selectedValue != undefined && value != undefined) {
      this.selectedOption = 'edit';
      var finYr = event.target.selectedOptions[0].text;
      var finMonth = value;
      var startDt = new Date(Date.parse(finMonth.split('-')[0] + "-" + finYr.split('-')[0]));
      var endDt = new Date(Date.parse(finMonth.split('-')[1] + "-" + finYr.split('-')[1]));
      this.entityid = Number(localStorage.getItem('EntityId'));
      this.financialStart = finYr.split('-')[0];
      this.financialEnd = finYr.split('-')[1];
      // this.rowData = [];
      // this.rowData.push({ dueDate: startDt.toLocaleDateString() });
      this.isYearSelected = true;
      this.BindGrid(this.loadedComplianceTracker);
      // for (let j = 0; j < 12; j++) {
      //   var stDate = startDt;
      //   stDate.setMonth(stDate.getMonth() + 1);
      //   var formattedDate = stDate.toLocaleDateString().slice(0, 10);
      //   console.log(formattedDate, new Date(formattedDate) <= endDt);
      //   // if (new Date(formattedDate) <= endDt) {
      //   //   // this.rowData.push({ cmpId: 0, forTheMonth: "2021-1", dueDate: formattedDate });
      //   // }
      // }


      // this.getRegulationComplianceByEntityId(Number(this.entityid));
      // this.entityList = [];
      // this.getRegulationComplianceByEntityId(value);

    }
    else {
      this.selectedOption = 'view';
    }
  }

  getRegulationComplianceByEntityId(entityid: number) {
    this.entityid = entityid;
    this.complianceTrackerService.getAllRegulationComplianceDetails(entityid).subscribe({
      next: (result: any) => {
        if (result != undefined && result.length > 0) {
          result.forEach((reg: any) => {
            reg.compliance.forEach((comp: any) => {
              //this.allCompliances.push(reg);
              this.getAllCompliances(reg.compliance);
            });
          });
          this.RegulationComplianceTrackerDetails = result;
          var lstCompTrackers = this.RegulationComplianceTrackerDetails[0].complianceTrackers;
          // var grdData = new Array<ComplianceTrackerModel>();
          this.BindGrid(lstCompTrackers);
        }
      },
      error: (error: any) => {
        console.log(error);
      }
      // this.compliacetracker = result;
    });
  }

  getAllCompliances(compliances: any) {
    // console.log('getAllCompliances', compliances)
    if (compliances != undefined && compliances.length > 0) {
      compliances.forEach((comp: any) => {
        // console.log('getall', comp);
        this.allCompliances.push(comp);
        if (comp.compliance != undefined && comp.compliance.length > 0) {
          this.getAllCompliances(comp.compliance);
        }
        // else{
        //   this.allCompliances.push(comp.compliance);
        // }
      });
    }
    // else{
    //   this.allCompliances.push(compliances);
    // }
    //return compliances;
  }

  getHistoryRegulationSetup() {
    var userId = this.persistance.getRole() === '1' ? null : this.persistance.getUserId();
    this.regulationSetupService.getRegulationSetupHistory(userId).subscribe((result: ReuglationListModle[]) => {
      this.regulationSetup = result;
      if (this.regulationSetup.length > 0)
        this.toggleRegulation(this.regulationSetup[0]!);
    });
  }

  getRegulationGroupSetup() {
    this.complianceTrackerService.getRegulationGroupList().subscribe((result: RegulationGroupModel[]) => {
      this.regulationGroupList = result;
    });
  }
  ShowCompliance() {
    this.currentComponent = 'Add-Compliance';
  }

  ShowTOC() {
    this.currentComponent = 'Add-TOC';
  }
  ShowRegulationSetup() {
    this.currentComponent = 'ragulation-setup';
  }

  reload(event: any) {
    this.modalService.dismissAll();
    this.getHistoryRegulationSetup();

  }

  selectedOption = 'view';  // Default option
  editableItems: Set<any> = new Set();  // Track items to be edited

  isEditable(item: any) {
    return this.selectedOption === 'edit';
  }

  editItem(item: any) {
    this.editableItems.add(item);  // Mark item as editable
  }

}
