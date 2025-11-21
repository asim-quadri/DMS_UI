import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'angular-notifier';
import { th } from 'date-fns/locale';
import { count, Observable } from 'rxjs';
import { BranchModel, TOBMapping } from 'src/app/Models/branchModel';
import { CountryModel } from 'src/app/Models/countryModel';
import {
  MajorIndustryModel,
  MinorIndustrypModel,
} from 'src/app/Models/industrysetupModel';
import { MenuOptionModel } from 'src/app/Models/Users';
import { BranchService } from 'src/app/Services/branch.service';
import { CountryService } from 'src/app/Services/country.service';
import { IndustryService } from 'src/app/Services/industry.service';
import { PersistenceService } from 'src/app/Services/persistence.service';

@Component({
  selector: 'app-branch-list',
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.scss'],
})
export class BranchListComponent {
  ngForm: any;
  closeResult = '';
  active = 3;
  searchCountryText: string = '';
  tobMapping: TOBMapping[] = [];
  countrytobMapping: TOBMapping[] = [];
  tobMappingByCountry: TOBMapping[] = [];
  countrymajortob: TOBMapping[] = [];
  majorminortob: TOBMapping[] = [];
  countries: CountryModel[] = [];
  majorIndustries: MajorIndustryModel[] = [];
  minorindustry: MinorIndustrypModel[] = [];
  tobmajorindustry: TOBMapping[] = [];
  tob: BranchModel[] = [];
  showAddButton: boolean = false;
  showAddTypeOfBranchButton: boolean = false;
  showApprovalButton: boolean = false;
  branchApprovalCount: string = '.';
  branchApprovalMappingCount: string = '.';
  branchApprovalInsertionCount: string = '.';
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    public countryService: CountryService,
    public industryService: IndustryService,
    private branchService: BranchService,
    private persistance: PersistenceService,
    private notifier: NotifierService
  ) {}
  formgroup: FormGroup = this.fb.group({
    tobId: [''],
    countryId: [''],
    majorIndustryId: [''],
    minorIndustryId: [''],
    tobName: [],
  });

  ngOnInit() {
    this.getCountries();
    //this.getMajorIndustries();
    this.getTOB();
    this.getTOBMapping();

    var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 10
      var menuOptions = roleMenuOptions.filter(
        (option: MenuOptionModel) => option.parentId === 10
      );
      console.log('branch setup Menu Options:', menuOptions);
      if (menuOptions.length > 0) {
        this.showAddButton =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'Add' && option.canView
          ).length > 0;
        this.showAddTypeOfBranchButton =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'Add Type Of Branch' && option.canView
          ).length > 0;
        this.showApprovalButton =
          menuOptions.filter(
            (option: MenuOptionModel) =>
              option.title === 'APPROVALS' && option.canView
          ).length > 0;
      }
    }
  }

  selectedCountries: string[] = [];
  selectedMajorIndustry: string[] = [];
  selectedMinorIndustry: string[] = [];
  selectedTob: {country:string, major:string, minor:string, tob:string}[] = [];
  getCountries() {
    this.countryService.getAllCountries().subscribe((result: any) => {
      this.countries = result;
      //this.toggleSelection(this.countries[0].id!);
    });
  }

  // getMajorIndustries(country: number) {
  //   if (this.majorIndustries.filter(f => f.countryId == country).length > 0 && this.majorIndustries.length > 0) {
  //     this.majorIndustries = this.majorIndustries.filter(f => f.countryId != country)
  //   }
  //   else {
  //     this.industryService.getIndustryMappingByCountry(country).subscribe((result: any) => {
  //
  //       result.forEach((element: any) => {
  //         this.majorIndustries.push(element);
  //       });

  //     });
  //   }
  // }

  getMajorIndustries(country: number) {
    this.industryService
      .getIndustryMappingByCountry(country)
      .subscribe((result: any) => {
        this.formgroup.patchValue({
          majorIndustries: [],
        });
        this.formgroup.updateValueAndValidity();
        this.majorIndustries = result;
      });
  }

  getTOB() {
    this.branchService.getAllTOB().subscribe((result: any) => {
      this.tob = result;
    });
  }

  getTOBMapping() {
    this.branchService.getTOBMapping().subscribe((result: TOBMapping[]) => {
      //let res = result.map((a: { majorIndustryName: any}) => a.majorIndustryName)
      //this.industryMapping = [...new Set(res)];
      this.tobMapping = result;
      if (this.tobMapping.length > 0) {
        // const item = [...new Set(this.industryMapping)]
        this.selectedCountries.push(this.tobMapping[0].countryName!);
        this.selectedMajorIndustry.push(this.tobMapping[0].majorIndustryName!);
        this.selectedMinorIndustry.push(this.tobMapping[0].minorIndustryName!);
      }
    });
  }

  getMinorIndustriesById(majorIndustryId: any) {
    this.industryService
      .getMinorIndustryById(majorIndustryId)
      .subscribe((result: any) => {
        this.formgroup.patchValue({
          minorIndustryId: [],
        });
        this.formgroup.updateValueAndValidity();
        this.minorindustry = result;
      });
  }

  getUniqueCountries() {
    var newArray = [
      ...new Map(
        this.tobMapping.map((item: TOBMapping) => [item.countryName, item])
      ).values(),
    ];
    if (this.searchCountryText != '')
      return newArray.filter((item) => !item.hide);
    else return newArray;
  }

  toggleMajorSelection(major: number, country: number) {
    if (
      this.countrymajortob.length > 0 &&
      this.countrymajortob.filter((f) => f.majorIndustryId == major && f.countryId==country).length > 0
    ) {
      this.countrymajortob = this.countrymajortob.filter(
        (f) => !(f.majorIndustryId == major  && f.countryId==country)
      );
    } else {
      this.branchService
        .getTOBMappingByMajor(major, country)
        .subscribe((result: any) => {
          result.forEach((element: any) => {
            this.countrymajortob.push(element);
          });
        });
    }
  }

  toggleMinorSelection(minor: number, major: number, country: number) {
    if (
      this.majorminortob.length > 0 &&
      this.majorminortob.filter((f) => f.minorIndustryId == minor && f.majorIndustryId==major && f.countryId==country).length > 0
    ) {
      this.majorminortob = this.majorminortob.filter(
        (f) => !(f.minorIndustryId == minor && f.majorIndustryId==major && f.countryId==country)
      );
    } else {
      this.branchService
        .getTOBMappingByMinor(minor, major, country)
        .subscribe((result: any) => {
          result.forEach((element: any) => {
            this.majorminortob.push(element);
          });
        });
    }
  }
  toggleTobSelection(
    tob: number,
    minor: number,
    major: number,
    country: number
  ) {
    const tobKey = {
      country: country.toString(),
      major: major.toString(),
      minor: minor.toString(),
      tob: tob.toString()
    };

    const existingIndex = this.selectedTob.findIndex(
      item => item.country === tobKey.country && 
             item.major === tobKey.major && 
             item.minor === tobKey.minor && 
             item.tob === tobKey.tob
    );

    if (existingIndex > -1) {
      this.selectedTob.splice(existingIndex, 1);
    } else {
      this.selectedTob.push(tobKey);
    }
  }

  toggleSelection(country: number) {
    if (
      this.tobMappingByCountry.filter((f) => f.countryId == country).length >
        0 &&
      this.tobMappingByCountry.length > 0
    ) {
      this.tobMappingByCountry = this.tobMappingByCountry.filter(
        (f) => f.countryId != country
      );
    } else {
      this.branchService
        .getTOBMappingByCountry(country)
        .subscribe((result: any) => {
          result.forEach((element: any) => {
            this.tobMappingByCountry.push(element);
          });
        });
    }
  }

  isSelected(country: string) {
    return this.tobMappingByCountry.some((c) => c.countryName === country);
  }

  isMajorSelected(major: string,country:string) {
    return this.countrymajortob.some(
      (m) => m.majorIndustryId?.toString() === major && m.countryId?.toString() === country
    );
  }
  isMinorSelected(minor: string,major:string,country:string) {
    return this.majorminortob.some(
      (m) => m.majorIndustryId?.toString() === major && m.countryId?.toString() === country && m.minorIndustryId?.toString() === minor
  );
  }
  isTobSelected(tob: string, minor: string, major: string, country: string) {
    return this.selectedTob.some(c=>c.tob==tob &&c.country==country && c.minor==minor && c.major==major) 
           
  }

  getGroupedIndustries(): {
    countryName: string;
    industries: {
      majorIndustryName: string;
      majorIndustryId: number;
      countryId: number;
    }[];
  }[] {
    const groupedIndustries: {
      [key: string]: {
        majorIndustryName: string;
        majorIndustryId: number;
        countryId: number;
      }[];
    } = {};

    // Filter or use the full array if no filter is applied
    const filteredArray: TOBMapping[] = this.tobMappingByCountry;

    // Group industries by country
    filteredArray.forEach((tob) => {
      if (!groupedIndustries[tob.countryName!]) {
        groupedIndustries[tob.countryName!] = [];
      }
      groupedIndustries[tob.countryName!].push({
        majorIndustryName: tob.majorIndustryName!,
        majorIndustryId: tob.majorIndustryId!,
        countryId: tob.countryId!,
      });
    });

    // Convert grouped object into an array format
    var obje = Object.keys(groupedIndustries).map((countryName) => ({
      countryName,
      industries: groupedIndustries[countryName],
    }));
    return obje;
  }

  getGroupedMajorIndustries(): {
    majorIndustryName: string;
    countryName: string;
    minors: {
      minorIndustryName: string;
      minorIndustryId: number;
      majorIndustryId: number;
      countryId: number;
    }[];
  }[] {
    const groupedIndustries: {
      [majorIndustryName: string]: {
        [countryName: string]: {
          minorIndustryName: string;
          minorIndustryId: number;
          majorIndustryId: number;
          countryId: number;
        }[];
      };
    } = {};

    // Filter or use the full array if no filter is applied
    const filteredArray: TOBMapping[] = this.countrymajortob;

    // Group minor industries by major industry and country
    filteredArray.forEach((industry) => {
      if (!groupedIndustries[industry.majorIndustryName!]) {
        groupedIndustries[industry.majorIndustryName!] = {};
      }

      if (
        !groupedIndustries[industry.majorIndustryName!][industry.countryName!]
      ) {
        groupedIndustries[industry.majorIndustryName!][industry.countryName!] =
          [];
      }

      groupedIndustries[industry.majorIndustryName!][
        industry.countryName!
      ].push({
        minorIndustryName: industry.minorIndustryName!,
        minorIndustryId: industry.minorIndustryId!,
        majorIndustryId: industry.majorIndustryId!,
        countryId: industry.countryId!,
      });
    });

    // Convert grouped object into an array format
    return Object.keys(groupedIndustries)
      .map((majorIndustryName) => {
        const countries = Object.keys(groupedIndustries[majorIndustryName]);

        return countries.map((countryName) => ({
          majorIndustryName,
          countryName,
          minors: groupedIndustries[majorIndustryName][countryName],
        }));
      })
      .flat();
  }

  getGroupedMinorTobs(): {
    minorIndustryName: string;
    majorIndustryName: string;
    countryName: string;
    tobs: { tobName: string; tobId: number,minorIndustryId:number,majorIndustryId:number,countryId:number  }[];
  }[] {
    const groupedIndustries: {
      [minorIndustryName: string]: {
        [majorIndustryName: string]: {
          [countryName: string]: { tobName: string; tobId: number, minorIndustryId:number,majorIndustryId:number,countryId:number }[];
        };
      };
    } = {};

    // Filter or use the full array if no filter is applied
    const filteredArray: TOBMapping[] = this.majorminortob;

    // Group minor industries by major industry and country
    filteredArray.forEach((industry) => {
      if (!groupedIndustries[industry.minorIndustryName!]) {
        groupedIndustries[industry.minorIndustryName!] = {};
      }

      if (
        !groupedIndustries[industry.minorIndustryName!][
          industry.majorIndustryName!
        ]
      ) {
        groupedIndustries[industry.minorIndustryName!][
          industry.majorIndustryName!
        ] = {};
      }

      if (
        !groupedIndustries[industry.minorIndustryName!][
          industry.majorIndustryName!
        ][industry.countryName!]
      ) {
        groupedIndustries[industry.minorIndustryName!][
          industry.majorIndustryName!
        ][industry.countryName!] = [];
      }

      groupedIndustries[industry.minorIndustryName!][
        industry.majorIndustryName!
      ][industry.countryName!].push({
        tobName: industry.tobName!,
        tobId: industry.tobId!,
        minorIndustryId: industry.minorIndustryId!,
        majorIndustryId: industry.majorIndustryId!,
        countryId: industry.countryId!,
      });
    });

    // Convert grouped object into an array format
    return Object.keys(groupedIndustries)
      .map((minorIndustryName) => {
        const countries = Object.keys(groupedIndustries[minorIndustryName]);

        return countries.flatMap((majorIndustryName) => {
          const countryNames = Object.keys(
            groupedIndustries[minorIndustryName][majorIndustryName]
          );

          return countryNames.map((countryName) => ({
            minorIndustryName,
            majorIndustryName,
            countryName,
            tobs: groupedIndustries[minorIndustryName][majorIndustryName][
              countryName
            ],
          }));
        });
      })
      .flat();
  }

  addTOBCountryIndustryMapping(event: any) {
    if (this.formgroup.valid) {
      var sourece: Observable<any>[] = [];

      const selectedMinorIndustryIds =
        this.formgroup.get('minorIndustryId')?.value;
      const selectedTobIds = this.formgroup.get('tobId')?.value;

      selectedMinorIndustryIds.forEach((minorIndustry: any) => {
        selectedTobIds.forEach((tob: any) => {
          const request: any = {};
          request.countryId = this.formgroup.get('countryId')?.value;
          request.majorIndustryId =
            this.formgroup.get('majorIndustryId')?.value;
          request.minorIndustryId = minorIndustry.id;
          request.tobId = tob.id;
          request.tobName = this.formgroup.get('tobName')?.value;
          request.managerId = this.persistance.getManagerId()!;
          request.createdBy = this.persistance.getUserId()!;
          sourece.push(this.branchService.postTOBMapping(request));
        });
      });
      if (sourece.length > 0) {
        this.branchService
          .multipleAPIRequests(sourece)
          .subscribe((result: any) => {
            const responseCode0States: string[] = [];
            const responseCode1States: string[] = [];
            let allResponseCode1 = true;
            result.forEach((item: any) => {
              if (item.responseCode === 0) {
                responseCode0States.push(item.minorIndustryName);
              } else {
                allResponseCode1 = false;
                responseCode1States.push(item.minorIndustryName);
              }
            });
            if (responseCode0States.length === 0) {
              this.reload('reload');
              this.formgroup.reset();
              this.notifier.notify(
                'success',
                `TOB ${responseCode1States.join(', ')} Added Successfully`
              );
            } else {
              this.notifier.notify(
                'error',
                `TOB ${responseCode0States.join(', ')} already exists`
              );
            }
          });
      }
    }
  }

  open(content: any) {
    this.modalService
      .open(content, { ariaLabelledBy: 'modal-basic-title', centered: true })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
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
    //this.getMajorIndustries();
    this.getTOB();
    this.getTOBMapping();
    this.formgroup.reset();
  }

  searchCountry(event: any) {
    this.tobMapping.filter((mapping) => {
      if (
        mapping.countryName &&
        mapping.countryName
          .toLowerCase()
          .includes(event.target.value.toLowerCase())
      ) {
        mapping.hide = false; // Show the mapping if it matches the search term
        return true;
      } else {
        mapping.hide = true; // Hide the mapping if it doesn't match the search term
        return false;
      }
    });
  }
}
