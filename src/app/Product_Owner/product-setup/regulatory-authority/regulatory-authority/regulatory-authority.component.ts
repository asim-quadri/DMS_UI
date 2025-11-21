import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { Observable } from 'rxjs';
import { CountryModel } from 'src/app/Models/countryModel';
import {
  CountryRegulatoryAuthorityMapping,
  RegulatoryAuthorities,
} from 'src/app/Models/postRegulatoryAuthorities';
import { UsersModel } from 'src/app/Models/Users';
import { CountryService } from 'src/app/Services/country.service';
import { EntityTypeService } from 'src/app/Services/entityType.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulatoryAuthorityService } from 'src/app/Services/regulatory-authorities.service';

@Component({
  selector: 'app-regulatory-authority',
  templateUrl: './regulatory-authority.component.html',
  styleUrls: ['./regulatory-authority.component.scss'],
})
export class RegulatoryAuthorityComponent implements OnInit {
  active = 6;
  closeResult = '';
  modal: any;
  selectedCountries: string[] = [];
  selectedRegAuth: { regAuth: string; country: string }[] = [];
  regAuthApprovalCount: string = '.';
  UserInfo: UsersModel = {} as UsersModel;
  countries: CountryModel[] = [];
  regulatoryAuthoritiesData: RegulatoryAuthorities[] = [];
  countryRegAuthMapping: CountryRegulatoryAuthorityMapping[] = [];
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private notifier: NotifierService,
    public countryService: CountryService,
    private regulatoryAuthService: RegulatoryAuthorityService,
    private persistance: PersistenceService
  ) {}
  ngOnInit(): void {
    this.UserInfo = this.persistance.getSessionStorage('currentUser');
    this.getCountries();
    this.getRegAuth();
    this.getCountryRegAuthMapping();
  }

  formgroup: FormGroup = this.fb.group({
    countryId: [
      '',
      [RxwebValidators.required({ message: 'Country is required' })],
    ],
    regulatoryAuthorityId: [
      '',
      [
        RxwebValidators.required({
          message: 'Regulatory Authority is required',
        }),
      ],
    ],
  });

  open(content: any) {
    this.modalService.open(content, { centered: true }).result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
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
    this.ngOnInit();
  }

  getCountries() {
    this.countryService.getAllCountries().subscribe((result: any) => {
      this.countries = result;
    });
  }
  getRegAuth() {
    this.regulatoryAuthService.getAllRegulatoryAuthorities().subscribe(
      (result: any) => {
        this.regulatoryAuthoritiesData = result;
      },
      (error: any) => {
        this.notifier.notify('error', 'An unexpected error occurred.');
        console.error('Error in getRegAuth:', error);
      }
    );
  }

  openXl(content: any) {
    this.modalService.open(content, { size: 'xl', centered: true });
  }

  getDropdownSelectedRegulatoryAuthority(regAuthId: any) {
    this.formgroup.patchValue({
      regulatoryAuthorityId: regAuthId,
    });
    this.formgroup.updateValueAndValidity();
  }
  addCountryRegulatoryAuthority(event: any) {
    if (this.formgroup.valid) {
      var source: Observable<any>[] = [];

      this.formgroup
        .get('regulatoryAuthorityId')!
        .value.forEach((param: any) => {
          var request: CountryRegulatoryAuthorityMapping = {
            countryId: 0,
            regulatoryAuthorityId: 0,
            createdOn: new Date(),
            createdBy: 0,
            uid: '',
          };
          request.countryId = this.formgroup.get('countryId')!.value;
          request.regulatoryAuthorityId = param.id;
          request.managerId = this.persistance.getManagerId()!;
          request.createdBy = this.persistance.getUserId()!;
          request.uid = this.UserInfo.uid!;
          source.push(
            this.regulatoryAuthService.postCountryRegulatoryAuthorityMapping(
              request
            )
          );
        });

      if (source.length > 0) {
        this.regulatoryAuthService
          .multipleAPIRequests(source)
          .subscribe((result: any) => {
            const successResponses: any[] = [];
            const errorResponses: any[] = [];

            result.forEach((item: any) => {
              if (item.success) {
                successResponses.push(item);
              } else {
                errorResponses.push(item);
              }
            });

            if (successResponses.length > 0) {
              this.notifier.notify('success', successResponses[0].message);
              this.reload('reload');
              this.formgroup.reset();
            } else if (errorResponses.length > 0) {
              this.notifier.notify('error', errorResponses[0].message);
            }
            if (successResponses.length === 0 && errorResponses.length === 0) {
              this.notifier.notify(
                'error',
                'No response received from server.'
              );
            }
          });
      }
    }
  }

  getCountryRegAuthMapping() {
    this.regulatoryAuthService
      .getAllRegAuthMapping()
      .subscribe((result: any) => {
        this.countryRegAuthMapping = result;
        if (this.countryRegAuthMapping.length > 0)
          this.toggleSelection(
            this.countryRegAuthMapping[0].countryName?.toString()!
          );
      });
  }

  toggleSelection(country: string) {
    if (this.isSelected(country)) {
      this.selectedCountries = this.selectedCountries.filter(
        (c) => c !== country
      );
    } else {
      this.selectedCountries.push(country);
    }
  }
  toggleRegAuthSelection(country: string, regAuth: string) {
    if (
      this.selectedRegAuth.length > 0 &&
      this.selectedRegAuth.filter(
        (c) => c.country == country && c.regAuth == regAuth
      ).length > 0
    ) {
      this.selectedRegAuth = this.selectedRegAuth.filter(
        (c) => c.country !== country && c.regAuth !== regAuth
      );
    } else {
      this.selectedRegAuth.push({ regAuth: regAuth, country: country });
    }
  }
  isSelected(country: string) {
    return this.selectedCountries.includes(country);
  }

  isRegAuthSelected(country: string, regAuth: string) {
    return this.selectedRegAuth.some(
      (c) => c.country == country && c.regAuth == regAuth
    );
  }

  getUniqueCountries() {
    var newArray = [
      ...new Map(
        this.countryRegAuthMapping.map(
          (item: CountryRegulatoryAuthorityMapping) => [item.countryName, item]
        )
      ).values(),
    ];

    return newArray.filter((item) => !item.hide);
  }

  getSelectedRegAuth(): { countryName: string; regAuth: string[] }[] {
    // Filter mappings for selected countries
    const filtered = this.countryRegAuthMapping.filter((item) =>
      this.selectedCountries.includes(item.countryName!)
    );

    // Group regulatory authorities by country name
    const grouped: { [country: string]: Set<string> } = {};
    filtered.forEach((item) => {
      const country = item.countryName!;
      const regAuth = item.regAuthName!;
      if (!grouped[country]) {
        grouped[country] = new Set();
      }
      grouped[country].add(regAuth);
    });

    // Convert to array format
    return Object.keys(grouped).map((countryName) => ({
      countryName,
      regAuth: Array.from(grouped[countryName]),
    }));
  }
  searchCountry(event: any) {
    this.countryRegAuthMapping.filter((mapping) => {
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
