import { Component, EventEmitter } from '@angular/core';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { billingdetails } from './billingdetails'
import { CountryService } from 'src/app/Services/country.service';
import { CountryModel, CountryStateMapping } from 'src/app/Models/countryModel';
import { Constant } from 'src/app/@core/utils/constant';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BillingDetailsService } from 'src/app/Services/billing-details.service';
import { ServiceProviderModel } from 'src/app/Models/ServiceProviderModel';
import { BillingFrequencyModel } from 'src/app/Models/BillingFrequencyModel';
import { BillStatusModel } from 'src/app/Models/BillStatusModel';
import { DeliveryStatusModel } from 'src/app/Models/DeliveryStatusModel';
import { BillingDetailsModel } from 'src/app/Models/billingDetailsModel';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { NotifierService } from 'angular-notifier';
import { ActivatedRoute } from '@angular/router';
import { OrganizationService } from 'src/app/Services/organization.service';
import { OrganizationDetail } from 'src/app/Models/organizationModel';
import { EntityService } from 'src/app/Services/entity.service';


@Component({
	selector: 'app-billing-details',
	templateUrl: './billing-details.component.html',
	styleUrls: ['./billing-details.component.scss'],
	providers: [billingdetails]
})
export class BillingDetailsComponent {
	active = 1;
	countryList: any[] = [];
	selectedItems: any[] = [];
	dropdownSettings: IDropdownSettings = {}
	countries: CountryModel[] = [];
	serviceProviders: ServiceProviderModel[] = [];
	billingFrequency: BillingFrequencyModel[] = [];
	billStatus: BillStatusModel[] = [];
	deliveryStatus: DeliveryStatusModel[] = [];
	formgroup: any;
	countryStateMapping: CountryStateMapping[] = [];
	selectedCountries: string[] = [];
	stateList = [];
	public reloaddata: EventEmitter<string> = new EventEmitter<string>();
	OrgId: any = 0;
	entityId: any = 0;
	organization: any;
	entity: any;
	billNumber: string = '';
	orderId: string = '';
	totalFee: number = 0;
	billAmount: number = 0;


	ngOnInit() {
		this.OrgId = this.route.snapshot.paramMap.get('id');
		this.entityId = this.route.snapshot.paramMap.get('entityId');
		this.organizationService.getOrganizationById(this.OrgId).subscribe((result: any) => {
			this.organization = result;
		});
		this.entityService.getEntityDetails(this.entityId).subscribe((result: any) => {
			this.entity = result;
		});
		this.getCountries();
		this.getCountrStateMapping();
		this.getAllServiceProvider();
		this.getAllBillStatus();
		this.getAllBillingFrequency();
		this.generateOrderId();
		this.generateBillNumber();
	}

	closeResult = '';
	constructor(private modalService: NgbModal,
		private fb: FormBuilder,
		private route: ActivatedRoute,
		public countryService: CountryService,
		public model: billingdetails,
		private notifier: NotifierService,
		private persistance: PersistenceService,
		private organizationService: OrganizationService,
		private entityService: EntityService,
		public billingDetailsService: BillingDetailsService
	) {
		this.formgroup = this.fb.group({
			pAN: ['', Validators.required],
			tAN: ['', Validators.required],
			gSTNo: ['', Validators.required],
			address: ['', Validators.required],
			city: ['', Validators.required],
			countryId: ['', Validators.required],
			stateId: ['', Validators.required],
			pIN: ['', Validators.required],
			serviceProvider: ['', Validators.required],
			feePerUser: ['', Validators.required],
			feePerEntity: ['', Validators.required],
			totalFee: ['', Validators.required],
			billDate: ['', Validators.required],
			billingFrequency: ['', Validators.required],
			remarks: ['', Validators.required],
			collectionDate: ['', Validators.required],
			billAmount: ['', Validators.required],
			tDS: ['', Validators.required],
			receivedAmount: ['', Validators.required],
			checkNumber: ['', Validators.required],
			billStatus: ['', Validators.required],
			orderId: ['', Validators.required],
			billNumber: ['', Validators.required],
			paymentTerm: ['', Validators.required],
			dueDate: [''],
			sameaddress: [false]
		});
		this.formgroup.reset();
		route.params.subscribe(val => {
			this.formgroup.reset();
			this.ngOnInit();
		});
	}

	calculateDueDate(){
		const billingDateValue = this.formgroup.get('billDate')?.value;
    	const paymentTermValue = Number(this.formgroup.get('paymentTerm')?.value);

		if (billingDateValue && paymentTermValue) {
			const billingDate = new Date(billingDateValue);
      		const dueDate = new Date(billingDate);

			dueDate.setDate(dueDate.getDate() + paymentTermValue);

			 const formattedDueDate = dueDate.toISOString().substring(0, 10);

			 this.formgroup.patchValue({ dueDate: formattedDueDate });
		}
	}

	getCountries() {
		const userId = this.persistance.getUserId()!;
		this.countryService.getAllCountryMaster(userId).subscribe((result: any) => {
			this.countries = result;
		});
	}
	onCountryChange(event: any) {
		const selectedValue = event.target.value;
		this.getStateById(selectedValue);
	}

	getCountrStateMapping() {
		this.countryService.getCountryStateMapping().subscribe((result: CountryStateMapping[]) => {
			this.countryStateMapping = result;
			if (this.countryStateMapping.length > 0) {
				this.selectedCountries.push(this.countryStateMapping[0].countryName!);
			}
		});
	}
	getStateById(countryId: any) {
		this.countryService.getSateById(countryId, this.persistance.getUserId()).subscribe((result: any) => {
			this.stateList = result;
		});
	}
	getAllServiceProvider() {
		this.billingDetailsService.getAllServiceProvider().subscribe((result: any) => {
			this.serviceProviders = result;
		});
	}
	getAllBillingFrequency() {
		this.billingDetailsService.getAllBillingFrequency().subscribe((result: any) => {
			this.billingFrequency = result;
		});
	}
	getAllBillStatus() {
		this.billingDetailsService.getAllBillStatus().subscribe((result: any) => {
			this.billStatus = result;
		});
	}
	getTotalFee() {
		var billingDetails: BillingDetailsModel = { ... this.formgroup.value };
		const feePerEntity = billingDetails.feePerEntity ?? 0;
		const feePerUser = billingDetails.feePerUser ?? 0;
		this.totalFee = (feePerEntity * (this.organization.numberOfEntities)) + (feePerUser * (this.organization.numberOfUsers));
	}
	getBillAmount() {
		var billingDetails: BillingDetailsModel = { ... this.formgroup.value };
		const tds = billingDetails.tDS ?? 0;
		this.billAmount = this.totalFee + ((tds / 100) * this.totalFee);
	}
	onAddressCheckboxChange(event: any) {
		const checkbox = event.target as HTMLInputElement;
		if (checkbox.checked) {
			if (this.entityId > 0) {
				this.getStateById(this.entity.countryId);
				this.formgroup.patchValue({
					countryId: this.entity.countryId,
					stateId: this.entity.stateId,
					city: this.entity.city,
					address: this.entity.address,
					pIN: this.entity.pin
				});
			} else {
				this.getStateById(this.organization.countryDDId);
				this.formgroup.patchValue({
					countryId: this.organization.countryDDId,
					stateId: this.organization.stateId,
					city: this.organization.city,
					address: this.organization.address,
					pIN: this.organization.pin
				});
			}
		}
	}

	onSubmit() {
		console.log(this.OrgId);
		console.log(this.entityId > 0 ? this.entityId : null);
		if (!this.formgroup.pristine) {
			var billingDetails: BillingDetailsModel = { ... this.formgroup.value };
			billingDetails.createdBy = this.persistance.getUserId()!;
			billingDetails.organizationId = this.OrgId;
			billingDetails.orderId = this.orderId;
			billingDetails.billNumber = this.billNumber;
			billingDetails.entityId = this.entityId > 0 ? this.entityId : null;
			billingDetails.totalFee = this.totalFee;
			this.billingDetailsService.postBillingDetails(billingDetails).subscribe((result: any) => {
				if (result) {
					this.notifier.notify("success", "Billing Details Sent for Approval");
					this.reloaddata.emit('reload');
					this.formgroup.reset();
					window.location.reload();
				}
				else {
					this.notifier.notify("error", "Something went wrong");
				}
			}, error => {
				this.notifier.notify("error", "Something went wrong");
			});
		} else {
			this.notifier.notify("error", "Please enter all the fields.");
		}
	}

	generateOrderId() {
		this.orderId = 'ORD' + this.formatDate(new Date());
		this.formgroup.patchValue({
			ordeerId: this.orderId
		});
	}
	generateBillNumber() {
		this.billNumber = 'B' + this.formatDate(new Date());
		this.formgroup.patchValue({
			billNumber: this.billNumber
		});
	}
	formatDate(date: Date): string {
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
		const year = date.getFullYear();
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

		return `${day}${month}${year}${hours}${minutes}${seconds}`;
	}




	open(content: any) {
		this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
			this.closeResult = `Closed with: ${result}`;
		}, (reason) => {
			this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
		});
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


	submit(f: any) {
		console.log(f);
	}

	isSecondTabVisited = true;
	isThirdTabVisited = false;
	isFourthTabVisited = false;
	isFifthTabVisited = false;
	isSixTabVisited = false;

	onTabChange = (event: any) => {
		this.onTabChangeNav(event.nextId);
	}
	onTabChangeNav = (nextId: any) => {
		if (nextId === 1) {
			this.isSecondTabVisited = true;
			this.isThirdTabVisited = false;
			this.isFourthTabVisited = false;
			this.isFifthTabVisited = false;
			this.isSixTabVisited = false;
		} else if (nextId === 2) {
			this.isSecondTabVisited = true;
			this.isThirdTabVisited = true;
			this.isFourthTabVisited = false;
			this.isFifthTabVisited = false;
			this.isSixTabVisited = false;
		} else if (nextId === 3) {
			this.isSecondTabVisited = true;
			this.isThirdTabVisited = true;
			this.isFourthTabVisited = true;
			this.isFifthTabVisited = false;
			this.isSixTabVisited = false;
		} else if (nextId === 4) {
			this.isSecondTabVisited = true;
			this.isThirdTabVisited = true;
			this.isFourthTabVisited = true;
			this.isFifthTabVisited = true;
			this.isSixTabVisited = false;
		} else if (nextId === 5) {
			this.isSecondTabVisited = true;
			this.isThirdTabVisited = true;
			this.isFourthTabVisited = true;
			this.isFifthTabVisited = true;
			this.isSixTabVisited = true;
		} else if (nextId === 6) {
			this.isSecondTabVisited = true;
			this.isThirdTabVisited = true;
			this.isFourthTabVisited = true;
			this.isFifthTabVisited = true;
			this.isSixTabVisited = true;
		} else {
			// Reset all flags if any other tab is clicked
			this.isSecondTabVisited = false;
			this.isThirdTabVisited = false;
			this.isFourthTabVisited = false;
			this.isFifthTabVisited = false;
			this.isSixTabVisited = false;
		}
	}
}