import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { Observable } from 'rxjs';
import { CountryModel } from 'src/app/Models/countryModel';
import {
  ConcernedMinistry,
  CountryConcernedMinistryMapping,
} from 'src/app/Models/postConcernedMinistry';
import { ConcernedMinistryService } from 'src/app/Services/concerned-ministry.service';
import { CountryService } from 'src/app/Services/country.service';
import { PersistenceService } from 'src/app/Services/persistence.service';

@Component({
  selector: 'app-concerned-ministry',
  templateUrl: './concerned-ministry.component.html',
  styleUrls: ['./concerned-ministry.component.scss'],
})
export class ConcernedMinistryComponent implements OnInit {
  active = 7;
  conMinApprovalCount: any = '.';
  selectedCountries: string[] = [];
  selectedConMin: { conMin: string; country: string }[] = [];
  closeResult = '';
  countries: CountryModel[] = [];
  concernedMinistryData: ConcernedMinistry[] = [];
  countryConcernedMinistryMapping: CountryConcernedMinistryMapping[] = [];
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private notifier: NotifierService,
    public countryService: CountryService,
    private concernedMinistryService: ConcernedMinistryService,
    private persistence: PersistenceService
  ) {}
  ngOnInit(): void {
    this.getCountries();
    this.getAllConcernedMinistry();
    this.getAllConcernedMinistryMappingList();
  }
  formgroup: FormGroup = this.fb.group({
    countryId: [
      '',
      [RxwebValidators.required({ message: 'Country is required' })],
    ],
    concernedMinistryId: [
      '',
      [
        RxwebValidators.required({
          message: 'Concerned Ministry is required',
        }),
      ],
    ],
  });

  getCountries() {
    this.countryService.getAllCountries().subscribe((result: any) => {
      this.countries = result;
    });
  }
  openXl(content: any) {
    this.modalService.open(content, { size: 'xl', centered: true });
  }

  searchCountry(event: any) {}
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

  getAllConcernedMinistry() {
    this.concernedMinistryService.getAllConcernedMinistry().subscribe(
      (result: any) => {
        this.concernedMinistryData = result;
      },
      (error: any) => {
        this.notifier.notify('error', 'An unexpected error occurred.');
        console.error('Error in getRegAuth:', error);
      }
    );
  }

  getDropdownSelectedConcernedMinistry(event: any) {
    this.formgroup.patchValue({
      ConcernedMinistryId: event.target.value,
    });
  }
  submitCountryConcernedMinistry() {
    if (this.formgroup.valid) {
      var source: Observable<any>[] = [];

      this.formgroup.get('concernedMinistryId')!.value.forEach((param: any) => {
        var request: CountryConcernedMinistryMapping = {
          countryId: 0,
          concernedMinistryId: 0,
          createdOn: new Date(),
          createdBy: 0,
          uid: '',
        };
        request.countryId = this.formgroup.get('countryId')!.value;
        request.concernedMinistryId = param.id;
        request.managerId = this.persistence.getManagerId()!;
        request.createdBy = this.persistence.getUserId()!;
        request.uid = '';
        source.push(
          this.concernedMinistryService.postCountryConcernedMinistryMapping(
            request
          )
        );
      });

      if (source.length > 0) {
        this.concernedMinistryService
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
  getAllConcernedMinistryMappingList() {
    this.concernedMinistryService
      .getAllConcernedMinistryMapping()
      .subscribe((result: any) => {
        this.countryConcernedMinistryMapping = result;
        if (this.countryConcernedMinistryMapping.length > 0)
          this.toggleSelection(
            this.countryConcernedMinistryMapping[0].countryName?.toString()!
          );
      });
  }
  isSelected(country: string) {
    return this.selectedCountries.includes(country);
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

    toggleConMinSelection(country: string, conMin: string) {
    if (
      this.selectedConMin.length > 0 &&
      this.selectedConMin.filter(
        (c) => c.country == country && c.conMin == conMin
      ).length > 0
    ) {
      this.selectedConMin = this.selectedConMin.filter(
        (c) => c.country !== country && c.conMin !== conMin
      );
    } else {
      this.selectedConMin.push({ conMin: conMin, country: country });
    }
  }
    isConMinSelected(country: string, conMin: string) {
    return this.selectedConMin.some(
      (c) => c.country == country && c.conMin == conMin
    );
  }
  getUniqueCountries() {
    var newArray = [
      ...new Map(
        this.countryConcernedMinistryMapping.map(
          (item: CountryConcernedMinistryMapping) => [item.countryName, item]
        )
      ).values(),
    ];

    return newArray.filter((item) => !item.hide);
  }
    getSelectedConcernedMinistry(): { countryName: string; concernedMinistry: string[] }[] {
        // Filter mappings for selected countries
        const filtered = this.countryConcernedMinistryMapping.filter(
          item => this.selectedCountries.includes(item.countryName!)
        );

        // Group regulatory authorities by country name
        const grouped: { [country: string]: Set<string> } = {};
        filtered.forEach(item => {
          const country = item.countryName!;
          const concernedMinistryList = item.concernedMinistryName!;
          if (!grouped[country]) {
            grouped[country] = new Set();
          }
          grouped[country].add(concernedMinistryList);
        });

        // Convert to array format
        return Object.keys(grouped).map(countryName => ({
          countryName,
          concernedMinistry: Array.from(grouped[countryName])
        }));
      }
}
