import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'angular-notifier';
import { Observable } from 'rxjs';
import { ModuleType } from 'src/app/enums/enums';
import { CountryModel, CountryStateApproval, CountryStateMapping, StatesModel } from 'src/app/Models/countryModel';
import { MenuOptionModel } from 'src/app/Models/Users';
import { CountryService } from 'src/app/Services/country.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { any } from 'underscore';

@Component({
  selector: 'app-country-list',
  templateUrl: './country-list.component.html',
  styleUrls: ['./country-list.component.scss']
})
export class CountryListComponent implements OnInit {
  @ViewChild('country') country: any;
  @ViewChild('mappingApprovals') mappingApprovals!: TemplateRef<any>;
  ngForm: any;
  closeResult = '';
  active = 1;
  countries: CountryModel[] = [];
  states: StatesModel[] = [];
  //dropdownSelectedStates:any = [];
  countryStateMapping: CountryStateMapping[] = [];

  searchCountryText: string = '';
  searchStateText: string = '';

  approvalCount: any= '.';
  selectedEditRecord: any;
  constructor(private modalService: NgbModal, private fb: FormBuilder, private notifier: NotifierService, public countryService: CountryService, private persistance: PersistenceService) { }

  formgroup: FormGroup = this.fb.group({
    countryId: ['', Validators.required],
    stateId: ['', Validators.required],
  });

  getCountries() {
    const userId = this.persistance.getUserId()!
    this.countryService.getAllCountryMaster(userId).subscribe((result: any) => {
      this.countries = result;
    });
  }

  getDropdownSelectedStates(states: any) {
    console.log(states);
    this.formgroup.patchValue({
      stateId: states
    });
    this.formgroup.updateValueAndValidity();
  }

  getStateById(countryId: any) {
    this.countryService.getSateById(countryId, this.persistance.getUserId()).subscribe((result: any) => {
      this.formgroup.patchValue({
        stateId: []
      });
      this.formgroup.updateValueAndValidity();
      this.stateList = result;
    });
  }

  getCountrStateMapping() {
    this.countryService.getCountryStateMapping().subscribe((result: CountryStateMapping[]) => {
      this.countryStateMapping = result;
      if (this.countryStateMapping.length > 0) {
        this.selectedCountries.push(this.countryStateMapping[0].countryName!);
      }
    });
  }

  getUniqueCountries() {
    var newArray = [...new Map(this.countryStateMapping.map((item: CountryStateMapping) =>
      [item.countryName, item])).values()];
    if (this.searchCountryText != "")
      return newArray.filter(item => !item.hide);
    else
      return newArray
  }

  // getSelectedStates() {
  //   var newArray = this.countryStateMapping.filter(item => this.selectedCountries.includes(item.countryName!));
  //   if (this.searchStateText != "")
  //     return newArray.filter(item => !item.hide);
  //   else
  //     return newArray
  // }

  getSelectedStates(): { countryName: string; states: { stateName: string,hide:boolean }[] }[] {
    const groupedStates: { [key: string]: { stateName: string ,hide:boolean}[] } = {};
    var newArray: CountryStateMapping[]  = this.countryStateMapping.filter(item => this.selectedCountries.includes(item.countryName!));
    newArray.forEach((state) => {
      if (!groupedStates[state.countryName!]) {
        groupedStates[state.countryName!] = [];
      }
      groupedStates[state.countryName!].push({ stateName: state.stateName!,hide:state.hide! });
    });
  
    return Object.keys(groupedStates).map((countryName) => ({
      countryName,
      states: groupedStates[countryName],
    }));
  }
  


  searchState(event: any) {
    this.countryStateMapping.filter(mapping => {
      if (mapping.stateName && mapping.stateName.toLowerCase().includes(event.target.value.toLowerCase())) {
        mapping.hide = false; // Show the mapping if it matches the search term
        return true;
      } else {
        mapping.hide = true; // Hide the mapping if it doesn't match the search term
        return false;
      }
    });
  }

  searchCountry(event: any) {
    this.countryStateMapping.filter(mapping => {
      if (mapping.countryName && mapping.countryName.toLowerCase().includes(event.target.value.toLowerCase())) {
        mapping.hide = false; // Show the mapping if it matches the search term
        return true;
      } else {
        mapping.hide = true; // Hide the mapping if it doesn't match the search term
        return false;
      }
    });
  }

  addCountryState(event: any) {

    if (this.formgroup.valid) {
      var sourece: Observable<any>[] = [];

      this.formgroup.get('stateId')!.value.forEach((param: any) => {
        var request: any = {};
        request.countryId = this.formgroup.get('countryId')?.value;
        request.stateId = param.id;
        request.managerId = this.persistance.getManagerId()!;
        request.createdBy = this.persistance.getUserId()!;
        sourece.push(this.countryService.postCountryStateMapping(request));
      });


      if (sourece.length > 0) {
        this.countryService.multipleAPIRequests(sourece).subscribe((result: any) => {
          
          var responseCode1States: any = [];
          var responseCode0States: any = [];
          let allResponseCode1 = true;

          result.forEach((item: any) => {
            if (item.responseCode === 0) {
              responseCode0States.push(item.stateName);
            } else {
              allResponseCode1 = false;
              responseCode1States.push(item.stateName);
            }
          });
            
          if (responseCode0States.length == 0) {
            this.reload('reload');
            this.formgroup.reset();
            this.notifier.notify("success", 'State ' + responseCode1States.join(', ') + ' Sent for Approval');
            //this.notifier.notify("success", 'State ' + responseCode1States.join(', ') + ' Added Successfully');
          } else {
            this.notifier.notify("error", 'State ' + responseCode0States.join(', ') + ' already exists');
          }
        });
      }



      // var request: CountryStateMapping = { ... this.formgroup.value }
      // request.managerId = this.persistance.getManagerId()!;
      // request.createdBy = this.persistance.getUserId()!;
      // this.countryService.postCountryStateMapping(request).subscribe({
      //   next: (result: CountryStateMapping) => {
      //     if (result.responseCode == 1) {
      //       this.notifier.notify("success", result.responseMessage);
      //       this.reload('reload');
      //       this.formgroup.reset();
      //     }
      //     else {
      //       this.notifier.notify("error", result.responseMessage);
      //     }

      //   },
      //   error: (error) => {
      //     console.log(error);
      //     this.notifier.notify("error", "Some thing went wrong");
      //   }
      // });
    }
  }

  removeState() {

  }



  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result: any) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason: any) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      },
    );
  }
  openXl(content: any) {
    this.modalService.open(content, { size: 'xl', centered: true });
  }
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
  countryList = [];
  countryList1 = [];
  stateList = [];
  menuOptions: MenuOptionModel[] = [];

  showAddButton: boolean = false;
  showEditButton: boolean = false;
  showAddStateButton: boolean = false;
  showAddCountryButton: boolean = false;
  showApprovalButton: boolean = false;

  selectedItems = [];
  dropdownSettings = {};
  statedropdownSettings = {};


  ngOnInit() {
   
    this.getCountries();
    this.getCountrStateMapping();
    var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');      
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 8
      this.menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 8);
      console.log('Country setup Menu Options:', this.menuOptions);     
      if (this.menuOptions.length > 0) {
        this.showAddButton = this.menuOptions.filter((option: MenuOptionModel) => option.title === 'Add' && option.canView).length > 0;
        this.showAddStateButton = this.menuOptions.filter((option: MenuOptionModel) => option.title === 'Add New State' && option.canView).length > 0;
        this.showAddCountryButton = this.menuOptions.filter((option: MenuOptionModel) => option.title === 'Add New Country' && option.canView).length > 0;
        this.showApprovalButton = this.menuOptions.filter((option: MenuOptionModel) => option.title === 'APPROVALS' && option.canView).length > 0;
        this.showEditButton = this.menuOptions.filter((option: MenuOptionModel) => option.title === 'Edit' && option.canView).length > 0;
      }
    }
  }
  onItemSelect(item: any) {
  }
  onSelectAll(items: any) {
  }


  selectedCountries: string[] = [];
 selectedStates: {state:string,country:string}[] = [];
  toggleSelection(country: string) {
    if (this.isSelected(country)) {
      this.selectedCountries = this.selectedCountries.filter(c => c !== country);
    } else {
      this.selectedCountries.push(country);
    }
  }
 toggleStateSelection(country: string,state:string) {
    if (this.isStateSelected(country, state)) {
      this.selectedStates = this.selectedStates.filter(c => !(c.country === country && c.state === state));
    } else {
      this.selectedStates.push({country: country, state: state});
    }
  }
  isSelected(country: string) {
    return this.selectedCountries.includes(country);
  }
   isStateSelected(country: string,state:string) {
    return this.selectedStates.some(c=>c.country==country && c.state==state);
  }

  reload(event: any) {
    this.modalService.dismissAll();
    this.getCountries();
    this.getCountrStateMapping();
    this.selectedEditRecord = null;
  }

  openCountryPopup(event: CountryStateApproval | undefined) {
    this.selectedEditRecord = event;
    console.log(this.selectedEditRecord);
     
    this.open(this.country);
  }

}
