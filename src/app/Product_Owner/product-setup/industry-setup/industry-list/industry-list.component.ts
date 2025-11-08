import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown'
import { CountryService } from '../../../../Services/country.service';
import { IndustryService } from '../../../../Services/industry.service';
import { CountryModel } from 'src/app/Models/countryModel';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CountryMajorMapping, IndustryMapping, MajorIndustryModel, MajorMinorMapping, MinorIndustrypModel } from '../../../../Models/industrysetupModel';
import { NotifierService } from 'angular-notifier';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { Observable } from 'rxjs';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { vi } from 'date-fns/locale';
import { MenuOptionModel } from 'src/app/Models/Users';

@Component({
  selector: 'app-industry-list',
  templateUrl: './industry-list.component.html',
  styleUrls: ['./industry-list.component.scss']
})
export class IndustryListComponent {
  ngForm: any;
  closeResult = '';
  active = 2;
  countries: CountryModel[] = [];
  majorIndustries: MajorIndustryModel[] = [];
  countrMajorMapping: CountryMajorMapping[] = [];
  majorMinorMapping: MajorMinorMapping[] = [];
  majorindustry = [];
  majorminorindustry: IndustryMapping[] = [];
  countrymajorindustry: IndustryMapping[] = [];
  minorindustry: MinorIndustrypModel[] = [];
  industryMapping: IndustryMapping[] = [];
  selectedItems = [];
  statedropdownSettings = {};
  searchCountryText: string = '';
  searchMajorIndustryText: string = '';
  searchMinorIndustryText: string = '';
  showAddButton: boolean = false;
  showAddMajorIndustryButton: boolean = false;
  showAddMinorIndustryButton: boolean = false;
  showApprovalButton: boolean = false;
  industryApprovalCount:any = '.';
  approvalMappingCount:any = '.';
  approvalInsertionCount:any = '.';

  ngOnInit() {
  
    this.getCountries();
    this.getMajorIndustries();
    this.getCountryMajorMapping();
    this.getMajorMinorMapping();
    this.getIndustryMapping();
    var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');      
        if (roleMenuOptions && roleMenuOptions.length > 0) {
          //get menu options for for parentId = 8
          var menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 9);
          console.log('industry setup Menu Options:', menuOptions);     
          if (menuOptions.length > 0) {
            this.showAddButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Add' && option.canView).length > 0;
            this.showAddMajorIndustryButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Add Major Industry' && option.canView).length > 0;
            this.showAddMinorIndustryButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Add Minor Industry' && option.canView).length > 0;
            this.showApprovalButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'APPROVALS' && option.canView).length > 0; 
          }
        }
  }

  selectedCountries: string[] = [];
  selectedMajorIndustry: string[] = [];
  clickeditem:{country:string,major:string,minor:string} [] = [];

  selectedMinorIndustry: string[]=[];

  toggleMinorSelection(country: string,major: string,minor: string) {
 
    const minorKey = {
      country: country.toString(),
      major: major.toString(),
      minor: minor.toString()
    };

    const existingIndex = this.clickeditem.findIndex(
      item => item.country === minorKey.country && 
             item.major === minorKey.major && 
             item.minor === minorKey.minor 
    );

    if (existingIndex > -1) {
      this.clickeditem.splice(existingIndex, 1);
    } else {
      this.clickeditem.push(minorKey);
    }
  
  }

  toggleSelection(country: number) {
    if (this.countrymajorindustry.filter(f => f.countryId == country).length > 0 && this.countrymajorindustry.length > 0) {
      this.countrymajorindustry = this.countrymajorindustry.filter(f => f.countryId != country)
    }
    else {
      this.industryService.getIndustryMappingByCountry(country).subscribe((result: any) => {
         
        result.forEach((element: any) => {
          this.countrymajorindustry.push(element);
        });

      });
    }
  }

  getGroupedIndustries(): { countryName: string; industries: { majorIndustryName: string; majorIndustryId: number; countryId: number }[] }[] {

    const groupedIndustries: { [key: string]: { majorIndustryName: string; majorIndustryId: number; countryId: number }[] } = {};

    // Filter or use the full array if no filter is applied
    const filteredArray: IndustryMapping[] = this.countrymajorindustry;

    // Group industries by country
    filteredArray.forEach((industry) => {
      if (!groupedIndustries[industry.countryName!]) {
        groupedIndustries[industry.countryName!] = [];
      }
      groupedIndustries[industry.countryName!].push({
        majorIndustryName: industry.majorIndustryName!,
        majorIndustryId: industry.majorIndustryId!,
        countryId: industry.countryId!
      });
    });

    // Convert grouped object into an array format
    var obje = Object.keys(groupedIndustries).map((countryName) => ({
      countryName,
      industries: groupedIndustries[countryName],
    }));
    return obje
  }


  isSelected(country: string) {
    return this.countrymajorindustry.some(item => item.countryName === country);
  }


  getGroupedMinorIndustries(): { majorIndustryName: string; countryName: string; minors: { minorIndustryName: string; minorIndustryId: number, majorIndustryId: number }[] }[] {
    const groupedIndustries: { [majorIndustryName: string]: { [countryName: string]: { minorIndustryName: string; minorIndustryId: number; majorIndustryId: number }[] } } = {};

    // Filter or use the full array if no filter is applied
    const filteredArray: IndustryMapping[] = this.majorminorindustry;

    // Group minor industries by major industry and country
    filteredArray.forEach((industry) => {
      if (!groupedIndustries[industry.majorIndustryName!]) {
        groupedIndustries[industry.majorIndustryName!] = {};
      }

      if (!groupedIndustries[industry.majorIndustryName!][industry.countryName!]) {
        groupedIndustries[industry.majorIndustryName!][industry.countryName!] = [];
      }

      groupedIndustries[industry.majorIndustryName!][industry.countryName!].push({
        minorIndustryName: industry.minorIndustryName!,
        minorIndustryId: industry.minorIndustryId!,
        majorIndustryId: industry.majorIndustryId!
      });
    });

    // Convert grouped object into an array format
    return Object.keys(groupedIndustries).map((majorIndustryName) => {
      const countries = Object.keys(groupedIndustries[majorIndustryName]);

      return countries.map((countryName) => ({
        majorIndustryName,
        countryName,
        minors: groupedIndustries[majorIndustryName][countryName],
      }));
    }).flat();
  }




  toggleMajorSelection(major: number, country: number) {

    if (this.majorminorindustry.length > 0 && this.majorminorindustry.filter(f => f.majorIndustryId == major && f.countryId == country).length > 0) {
      this.majorminorindustry = this.majorminorindustry.filter(f => !(f.majorIndustryId == major && f.countryId == country));
    }
    else {
      this.industryService.getIndustryMappingByMajor(major, country).subscribe((result: any) => {
        result.forEach((element: any) => {
          this.majorminorindustry.push(element);
        });
      });
    }
  }

  isMajorSelected(major: number,county:number) {
    return this.majorminorindustry.some(m=>m.majorIndustryId==major && m.countryId==county);
  }

    isMinorSelected(minor: number, major: number, country: string) {
    return this.clickeditem.some(m=>m.major==major.toString() && m.country==country&& m.minor==minor.toString());
  }
  constructor(private modalService: NgbModal, private fb: FormBuilder, public industryService: IndustryService,
    public countryService: CountryService, private persistance: PersistenceService, private notifier: NotifierService, private regulationsetupservice: RegulationSetupService) { }
  formgroup: FormGroup = this.fb.group({
    countryId: [''],
    majorIndustryId: [''],
    minorIndustryId: ['']
  });

  getCountries() {
    this.countryService.getAllCountryMaster(this.persistance.getUserId()!).subscribe((result: any) => {
      this.countries = result;
      this.toggleSelection(this.countries[0].id!);
    });
  }

  getMajorIndustries() {
    this.industryService.getAllMajorIndustries().subscribe((result: any) => {
      this.majorIndustries = result;
    });
  }

  getUniqueCountries() {
    var newArray = [...new Map(this.industryMapping.map((item: IndustryMapping) =>
      [item.countryName, item])).values()];
    if (this.searchCountryText != "")
      return newArray.filter(item => !item.hide);
    else
      return newArray
  }

  getUniqueMajorIndustries() {
    var newArray = [...new Map(this.industryMapping.map((item: IndustryMapping) =>
      [item.majorIndustryName, item])).values()];
    if (this.searchMajorIndustryText != "")
      return newArray.filter(item => !item.hide);
    else
      return newArray
  }

  getMajorIndustriesById(countryId: any) {
    this.industryService.getMajorIndustryById(countryId).subscribe((result: any) => {
      this.formgroup.patchValue({
        majorIndustryId: []
      })
      this.formgroup.updateValueAndValidity();
      this.majorindustry = result;
    });
  }

  getMinorIndustriesByMajorId(majorIndustryId: any) {
    this.regulationsetupservice.GetMinorIndustrybyMajorID(majorIndustryId).subscribe((result: MajorMinorMapping[]) => {
      this.majorMinorMapping = result;
      if (this.industryMapping.length > 0) {
        this.selectedMinorIndustry.push(this.majorMinorMapping[0].minorIndustryName!);
      }
    });
  }

  getMinorIndustriesById(majorIndustryId: any) {
    this.industryService.getMinorIndustryById(majorIndustryId).subscribe((result: any) => {
      this.formgroup.patchValue({
        minorIndustryId: []
      })
      this.formgroup.updateValueAndValidity();
      this.minorindustry = result;
    });
  }

  getCountryMajorMapping() {
    this.industryService.getCountryMajorMapping().subscribe((result: CountryMajorMapping[]) => {
      this.countrMajorMapping = result;
      if (this.countrMajorMapping.length > 0) {
        this.selectedCountries.push(this.countrMajorMapping[0].countryName!);
       
      }
    });
  }

  getMajorMinorMapping() {
    this.industryService.getMajorMinorMapping().subscribe((result: MajorMinorMapping[]) => {
      this.majorMinorMapping = result;
      if (this.majorMinorMapping.length > 0) {
        this.selectedCountries.push(this.countrMajorMapping[0].countryName!);
      }
    });
  }

  getIndustryMapping() {
    this.industryService.getIndustryMapping().subscribe((result: IndustryMapping[]) => {
      //let res = result.map((a: { majorIndustryName: any}) => a.majorIndustryName)
      //this.industryMapping = [...new Set(res)];
      this.industryMapping = result;
      if (this.industryMapping.length > 0) {
        // const item = [...new Set(this.industryMapping)]
        const Majoritem = [...new Set(this.industryMapping.filter(x => x.majorIndustryId))]
        this.selectedCountries.push(this.industryMapping[0].countryName!);
        this.selectedMajorIndustry.push(this.industryMapping[0].majorIndustryName!);
        this.selectedMinorIndustry.push(this.industryMapping[0].minorIndustryName!);
      }
    });
  }

  getSelectedMajorIndustry() {
    var newArray = this.industryMapping.filter(item => this.selectedMajorIndustry.includes(item.majorIndustryName!));
    if (this.searchMinorIndustryText != "")
      return newArray.filter(item => !item.hide);
    else
      return newArray
  }

  getSelectedCountry() {
    var newArray = this.industryMapping.filter(item => this.selectedCountries.includes(item.countryName!));
    if (this.searchMajorIndustryText != "")
      return newArray.filter(item => !item.hide);
    else
      return newArray
  }

  searchCountry(event: any) {
    this.industryMapping.filter(mapping => {
      if (mapping.countryName && mapping.countryName.toLowerCase().includes(event.target.value.toLowerCase())) {
        mapping.hide = false; // Show the mapping if it matches the search term
        return true;
      } else {
        mapping.hide = true; // Hide the mapping if it doesn't match the search term
        return false;
      }
    });
  }

  addCountryMajor(event: any) {

    if (this.formgroup.valid) {
      var request: IndustryMapping = { ... this.formgroup.value }
      request.managerId = this.persistance.getManagerId()!;
      request.createdBy = this.persistance.getUserId()!;
      this.industryService.postCountryMajorMapping(request).subscribe({
        next: (result: IndustryMapping) => {
          if (result.responseCode == 1) {
            this.notifier.notify("success", result.responseMessage);
            //this.reload();
            this.formgroup.reset();
          }
          else {
            this.notifier.notify("error", result.responseMessage);
          }

        },
        error: (error) => {
          console.log(error);
          this.notifier.notify("error", "Some thing went wrong");
        }
      });
    }
  }

  addMajorMinor(event: any) {

    if (this.formgroup.valid) {
      var sourece: Observable<any>[] = [];

      this.formgroup.get('minorIndustryId')!.value.forEach((param: any) => {
        var request: any = {};
        request.countryId = this.formgroup.get('countryId')?.value;
        request.majorIndustryId = this.formgroup.get('majorIndustryId')?.value;
        request.minorIndustryId = param.id;
        request.managerId = this.persistance.getManagerId()!;
        request.createdBy = this.persistance.getUserId()!;
        sourece.push(this.industryService.postCountryMajorMapping(request));
      });

      if (sourece.length > 0) {
        this.industryService.multipleAPIRequests(sourece).subscribe((result: any) => {
          var responseCode1States: any = [];
          var responseCode0States: any = [];
          let allResponseCode1 = true;

          result.forEach((item: any) => {
            if (item.responseCode === 0) {
              responseCode0States.push(item.minorIndustryName);
            } else {
              allResponseCode1 = false;
              responseCode1States.push(item.minorIndustryName);
            }
          });

          if (responseCode0States.length == 0) {
            this.reload('reload');
            this.formgroup.reset();
            this.notifier.notify("success", 'Minor Industry ' + responseCode1States.join(', ') + ' Added Successfully');
            this.getIndustryMapping();
          } else {
            this.notifier.notify("error", 'Minor Industry ' + responseCode0States.join(', ') + ' already exists');
          }
        });
      }
    }
  }

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
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

  reload(event: any) {
    this.modalService.dismissAll();
    this.getCountries();
    this.getIndustryMapping();
    this.getCountryMajorMapping();
    this.getMajorMinorMapping();
    this.getMajorIndustries();
    this.formgroup.reset();

  }
}
