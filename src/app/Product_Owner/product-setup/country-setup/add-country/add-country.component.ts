import { formatDate } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import {
  CountryModel,
  CountryStateApproval,
} from 'src/app/Models/countryModel';
import { CurrencyModel } from 'src/app/Models/countryModel';
import { CountryService } from 'src/app/Services/country.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { fromToDate } from 'src/app/Validators/dateReange';

@Component({
  selector: 'app-add-country',
  templateUrl: './add-country.component.html',
  styleUrls: ['./add-country.component.scss'],
})
export class AddCountryComponent {
  selectedCurrency: any;

  currencyCode:any;
  ngOnInit(): void {
    this.getCurrencies();
    this.getFromDates();
    this.getToDates();
  }

  headerLabel: string = 'Add New Country';
  buttonLabel: string = 'Add Country';
  currentApprovalRecord: CountryStateApproval | undefined;
  @Input()
  modal: any;

  @Input()
  public set selectedEditRecord(countryStateApproval: CountryStateApproval) {
    if (countryStateApproval) {
      this.currentApprovalRecord = countryStateApproval;
      this.headerLabel = 'Edit Country';
      this.buttonLabel = 'Update Country';
      //get countries and find the country by name
      const userId = this.persistance.getUserId()!;
    
      this.countryService
        .getAllCountryMaster(userId)
        .subscribe((result: CountryModel[]) => {
          const country = result.find(
            (c) => c.countryName === countryStateApproval.countryName
          );
          if (country) {
            console.log(country);
            this.formgroup.patchValue({
              uid: country.uid,
              id: country.id,
              countryName: country.countryName,
              countryCode: country.countryCode,
              countryCodeNumber: country.countryCodeNumber,
              financialStartDate: formatDate(
                country.financialStartDate,
                'dd-MMM-yyyy',
                'en'
              ),
              currencyCode: country.currencyCode,
              countryReferenceCode: country.countryReferenceCode
            });
            
               this.getToDates();
               this.formgroup.get('financialEndDate')?.setValue(formatDate(
                country.financialEndDate,
                'dd-MMM-yyyy',
                'en'
              ));
           this.formgroup.get('countryReferenceCode')?.disable();

            this.fileNames = country.fileNames || [];
          }
        });
    }
  }

  @Output()
  public reloaddata: EventEmitter<string> = new EventEmitter<string>();
  currencies: CurrencyModel[] = [];
  fromDates: { id: string; fromDate: string }[] = [];
  toDates: { id: string; toDate: string }[] = [];
  fileName = '';
  fileNames: string[] = [];
  dropdownConfig = {
    displayKey: 'currencyCode',
    search: true,
    height: '200px',
    placeholder: 'Select Currency',
    customComparator: undefined,
    limitTo: this.currencies.length,
    moreText: 'more',
    noResultsFound: 'No results found!',
    searchPlaceholder: 'Search',
    searchOnKey: 'currencyCode',
    clearOnSelection: false,
    inputDirection: 'ltr',
  };
  constructor(
    private fb: FormBuilder,
    public countryService: CountryService,
    private notifier: NotifierService,
    private persistance: PersistenceService
  ) {
    this.headerLabel = 'Add New Country';
    this.buttonLabel = 'Add Country';
    this.formgroup.reset();
  }

  formgroup: FormGroup = this.fb.group(
    {
      uid: [''],
      id: [''],
      countryReferenceCode: [null],
      countryName: [
        '',
        [RxwebValidators.required({ message: 'Country name is required' })],
      ],
      countryCode: [
        '',
        [
          RxwebValidators.required({ message: 'Country Code is required' }),
          RxwebValidators.alpha({
            message: 'Country Code must contain only characters',
          }),
          RxwebValidators.minLength({
            value: 3,
            message: 'Country Code must be exactly 3 characters',
          }),
          RxwebValidators.maxLength({
            value: 3,
            message: 'Country Code must be exactly 3 characters',
          }),
        ],
      ],
      countryCodeNumber: [
        '',
        [
          RxwebValidators.required({
            message: 'Country Code Number is required',
          }),
          RxwebValidators.pattern({
            message: 'Invalid Country Code',
            expression: { onlyNumeric: /^[0-9+]+$/ },
          }),
        ],
      ],
      currencyCode: [
        '',
        [RxwebValidators.required({ message: 'currency is required' })],
      ],
      fileName: [''],
      fileNames: [[]],
      financialStartDate: [
        '',
        RxwebValidators.required({ message: 'Start Date is required' }),
      ],
      financialEndDate: [
        '',
        RxwebValidators.required({ message: 'End Date is required' }),
      ],
    },
    {
      Validators: [
        fromToDate('financialStartDate', 'financialEndDate', { oaddate: true }),
      ],
    }
  );

  validateCurrentDates(event: any) {
    const parseDate = (str: string): Date => {
      const [day, monthAbbr, year] = str.split('-');
      const monthMap = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };
      return new Date(
        +year,
        monthMap[monthAbbr as keyof typeof monthMap],
        +day
      );
    };

    const financialStartDate = this.formgroup.get('financialStartDate')?.value;
    const financialEndDate = this.formgroup.get('financialEndDate')?.value;

    if (financialStartDate != null && financialEndDate != null) {
      const fromDate = parseDate(financialStartDate);
      const toDate = parseDate(financialEndDate);
      console.log('Financial Start Date:', fromDate);
      console.log('Financial End Date:', toDate);

      const yearDiff = fromDate.getFullYear() - toDate.getFullYear();
      const monthDiff = toDate.getMonth() - fromDate.getMonth();
      const totalMonths = yearDiff * 12 + monthDiff;

      if (totalMonths !== 11) {
        RxwebValidators.range({
          message: 'From and To dates must span exactly 12 months',
        });
      }
    }
    if (
      formatDate(financialEndDate?.value, 'yyyy-MM-dd', 'en') <
      formatDate(financialStartDate?.value, 'yyyy-MM-dd', 'en')
    ) {
      financialEndDate?.clearValidators();
      financialEndDate?.setValidators([
        RxwebValidators.required({ message: 'End Date is required' }),
        RxwebValidators.maxDate({
          fieldName: 'financialStartDate',
          message: 'End date cannot be prior to start date',
        }),
      ]);
    } else {
      financialEndDate?.clearValidators();
      financialStartDate?.clearValidators();
      if (financialEndDate?.value == '' || financialStartDate?.value == '') {
        financialStartDate?.setValidators([
          RxwebValidators.required({ message: 'Start Date is required' }),
        ]);
      }
      if (financialEndDate?.value == '' || financialStartDate?.value != '') {
        financialEndDate?.setValidators([
          RxwebValidators.required({
            message: 'End Date is required',
          }),
        ]);
      }
      if (financialEndDate?.value == '' && financialStartDate?.value == '') {
        financialEndDate?.clearValidators();
        financialStartDate?.clearValidators();
      }
    }
    financialStartDate?.updateValueAndValidity();
    financialStartDate?.markAsTouched();
    financialEndDate?.updateValueAndValidity();
    financialEndDate?.markAsTouched();
  }

  getCurrencies() {
    this.countryService.getAllCurrencies().subscribe((result: any) => {
      this.currencies = result;
      console.log(this.currencies);
    });
  }

  getFromDates() {
    const year = new Date().getFullYear();
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    //this.fromDates = months.map(month => `${month}-${year}`);
    this.fromDates = months.map((month) => {
      const value = `${month}-${year}`;
      return { id: `01-${value}`, fromDate: value };
    });
  }

  getToDates(event?: any) {
    let startYear = new Date().getFullYear();
    let startMonthIndex = 0;
    let selectedFromDate: string | undefined;

    // Get value from event if present
    if (event && event.target && event.target.value) {
      selectedFromDate = event.target.value;
    } else if (this.formgroup.get('financialStartDate')?.value) {
      selectedFromDate = this.formgroup.get('financialStartDate')?.value;
    }

    if (selectedFromDate) {
      let monthAbbr: string;
      let yearStr: string;
      if (selectedFromDate.includes('-')) {
        const parts = selectedFromDate.split('-');
        if (parts.length === 3) {
          // "01-Jan-2025"
          monthAbbr = parts[1];
          yearStr = parts[2];
        } else {
          monthAbbr = parts[0];
          yearStr = parts[1];
        }
        const months = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        startMonthIndex = months.indexOf(monthAbbr);
        startYear = parseInt(yearStr, 10);

        // Generate toDates for 12 months starting from the next month after start
        this.toDates = [];
        for (let i = 11; i < 24; i++) {
          let endMonthIndex = (startMonthIndex + i) % 12;
          let endYear = startYear + Math.floor((startMonthIndex + i) / 12);
          const endMonthAbbr = months[endMonthIndex];
          // Get last day of the end month
          const lastDayOfEndMonth = new Date(
            endYear,
            endMonthIndex + 1,
            0
          ).getDate();
          const toDateStr = `${lastDayOfEndMonth}-${endMonthAbbr}-${endYear}`;
          this.toDates.push({
            id: toDateStr,
            toDate: `${endMonthAbbr}-${endYear}`,
          });
        }
        return;
      }
    }
    // Default: set toDates to empty if no valid fromDate
    this.toDates = [];
  }
  selectionChanged(event: any) {
    const selectedCurrency = this.currencies.find(
      (currency) => currency.currencyCode === event
    );
    if (selectedCurrency) {
      this.selectedCurrency = selectedCurrency;
      console.log('Selected Currency:', this.selectedCurrency);
    } else {
      console.error('Selected currency not found in the list');
    }
  }
  addFileName() {
    const trimmed = this.formgroup.get('fileName')?.value?.trim();
    var isDuplicate = this.fileNames.some(
      (name) => name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      this.notifier.notify('error', 'File name already exists');
      return;
    }
    if (trimmed && !isDuplicate) {
      this.fileNames.push(trimmed);
      this.formgroup.get('fileName')?.reset();
    }
  }

  removeFileName(index: number) {
    this.fileNames.splice(index, 1);
  }

  onSubmit() {
    if (this.formgroup.valid) {
      var country: CountryModel = { ...this.formgroup.value };
      country.fileNames = this.fileNames;
      country.createdBy = this.persistance.getUserId()!;
      country.managerId = this.persistance.getManagerId()!;
      const countryReferenceCodeControl = this.formgroup.get('countryReferenceCode');
      country.countryReferenceCode = countryReferenceCodeControl && countryReferenceCodeControl.value
        ? countryReferenceCodeControl.value.trim()
        : '';
        this.currencyCode=country.currencyCode;
      if (
        this.currencyCode &&
        this.currencyCode.id &&
        this.currencyCode.currencyCode
      ) {
        country.currencyCode =this.currencyCode.currencyCode;

        country.currencyId= this.currencyCode.id;
        
      }
      const parseDateToISOString = (dateStr: string): string => {
        const [day, monthStr, year] = dateStr.split('-');
        const monthMap: Record<string, number> = {
          Jan: 0,
          Feb: 1,
          Mar: 2,
          Apr: 3,
          May: 4,
          Jun: 5,
          Jul: 6,
          Aug: 7,
          Sep: 8,
          Oct: 9,
          Nov: 10,
          Dec: 11,
        };
        const month = monthMap[monthStr];
        return new Date(Date.UTC(+year, month, +day)).toISOString();
      };
      country.financialStartDate = parseDateToISOString(
        country.financialStartDate
      );
      country.financialEndDate = parseDateToISOString(country.financialEndDate);
      if (country.id == 0 || country.id == null) {
        country.id = 0;
        country.uid = null;
      }
      if (this.currentApprovalRecord) {
        country.ApprovalUID = this.currentApprovalRecord.uid!;
      }
      this.countryService.postCountry(country).subscribe(
        (result: CountryModel) => {
          if (result.responseCode == 1) {
            this.notifier.notify('success', result.responseMessage);
            this.reloaddata.emit('reload');
            this.formgroup.reset();
          } else {
            this.notifier.notify('error', result.responseMessage);
          }
        },
        (error) => {
          this.notifier.notify('error', 'Some thing went wrong');
        }
      );
    }
  }

  private generateCountryUniqueCode(): void {
    this.countryService.getLastCountryIndex().subscribe({
      next: (lastIndex: number) => {
          this.formgroup
        .get('countryReferenceCode')
        ?.setValue(lastIndex);
      this.formgroup.get('countryReferenceCode')?.disable();
      },
      error: (err) => {
        // Handle error if needed
      }
    });
  }

  //Set CountryUniqueCode on form init and when adding a new country
  ngAfterViewInit() {
    if (!this.currentApprovalRecord) {
    this.generateCountryUniqueCode();
    }
  }
}
