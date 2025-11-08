import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { Observable } from 'rxjs';
import { CountryModel } from 'src/app/Models/countryModel';
import { EntityTypeModel } from 'src/app/Models/entityTypeModel';
import { CountryService } from 'src/app/Services/country.service';
import { EntityTypeService } from 'src/app/Services/entityType.service';
import { PersistenceService } from 'src/app/Services/persistence.service';

@Component({
	selector: 'app-entityType-grouping',
	templateUrl: './entity-type.component.html',
	styleUrls: ['./entity-type.component.scss']
})
export class EntityTypeComponent implements OnInit {
	selectedCountries: string[] = [];
	closeResult = '';
	active = 4;
	countries: CountryModel[] = [];
	entityType: EntityTypeModel[] = [];
	countryEntityTypeMapping: EntityTypeModel[] = [];
	entityTypeApprovalCount: string = '.';

	searchCountryText: string = '';
	searchEntityTypeText: string = '';
	constructor(private modalService: NgbModal, private fb: FormBuilder,
		private notifier: NotifierService, public countryService: CountryService,
		public entityTypeService: EntityTypeService, private persistance: PersistenceService) { }

	formgroup: FormGroup = this.fb.group({
		countryId: ['', [
			RxwebValidators.required({ message: 'Country is required' })
		]],
		entityTypeId: ['', [
			RxwebValidators.required({ message: 'Entity Type is required' })
		]],
	});

	ngOnInit(): void {
		this.getCountries();
		this.getEntityTypes();
		this.getCountrStateMapping();
	}
	getCountries() {
		this.countryService.getAllCountries().subscribe((result: any) => {
			this.countries = result;
		});
	}

	getEntityTypes() {
		this.entityTypeService.getAllEntityTypes().subscribe((result: any) => {
			this.entityType = result;
		});
	}

	getDropdownSelectedStates(entity: any) {
		console.log(entity);
		this.formgroup.patchValue({
			entityTypeId: entity
		});
		this.formgroup.updateValueAndValidity();
	}

	addCountryEntityType(event: any) {


		if (this.formgroup.valid) {

			var sourece: Observable<any>[] = [];

			this.formgroup.get('entityTypeId')!.value.forEach((param: any) => {
				var request: any = {};
				request.countryId = this.formgroup.get('countryId')!.value
				request.entityTypeId = param.id
				request.managerId = this.persistance.getManagerId()!;
				request.createdBy = this.persistance.getUserId()!;
				sourece.push(this.entityTypeService.postCountryEntityTypeMapping(request));
			});

			if (sourece.length > 0) {
				this.entityTypeService.multipleAPIRequests(sourece).subscribe((result: any) => {

					var responseCode1States: any = [];
					var responseCode0States: any = [];
					let allResponseCode1 = true;

					result.forEach((item: any) => {
						if (item.responseCode === 0) {
							responseCode0States.push(item.entityType);
						} else {
							allResponseCode1 = false;
							responseCode1States.push(item.entityType);
						}
					});

					if (responseCode0States.length == 0) {
						this.reload('reload');
						this.formgroup.reset();
						this.notifier.notify("success", 'Entity ' + responseCode1States.join(', ') + ' Mapped Successfully');
					} else {
						this.notifier.notify("error", 'Entity ' + responseCode0States.join(', ') + ' already exists');
					}
				});
			}










			// var request: EntityTypeModel = { ... this.formgroup.value }
			// request.managerId = this.persistance.getManagerId()!;
			// request.createdBy = this.persistance.getUserId()!;
			// this.entityTypeService.postCountryEntityTypeMapping(request).subscribe({
			// 	next: (result: EntityTypeModel) => {
			// 		if (result.responseCode == 1) {
			// 			this.notifier.notify("success", result.responseMessage);
			// 			this.reload('reload');
			// 			this.formgroup.reset();
			// 		}
			// 		else {
			// 			this.notifier.notify("error", result.responseMessage);
			// 		}

			// 	},
			// 	error: (error) => {
			// 		console.log(error);
			// 		this.notifier.notify("error", "Some thing went wrong");
			// 	}
			// });
		}
	}

	getCountrStateMapping() {
		this.entityTypeService.getCountryEntityTypeMapping().subscribe((result: EntityTypeModel[]) => {
			this.countryEntityTypeMapping = result;
			if (this.countryEntityTypeMapping.length > 0)
				this.toggleSelection(this.countryEntityTypeMapping[0].countryName?.toString()!)
		});
	}

	getUniqueCountries() {
		var newArray = [...new Map(this.countryEntityTypeMapping.map((item: EntityTypeModel) =>
			[item.countryName, item])).values()];
		return newArray.filter(item => !item.hide);
	}

	open(content: any) {
		this.modalService.open(content, { centered: true }).result.then(
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

	reload(event: any) {
		this.modalService.dismissAll();
		this.ngOnInit();

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

	toggleSelection(country: string) {
		if (this.isSelected(country)) {
			this.selectedCountries = this.selectedCountries.filter(c => c !== country);
		} else {
			this.selectedCountries.push(country);
		}
	}


	isSelected(country: string) {
		return this.selectedCountries.includes(country);
	}

	// getSelectedEntityTypes() {
	// 	var newArray = this.countryEntityTypeMapping.filter(item => this.selectedCountries.includes(item.countryName!));
	// 	if (this.searchEntityTypeText != "")
	// 		return newArray.filter(item => !item.hide);
	// 	else
	// 		return newArray
	// }

	getSelectedEntityTypes(): { countryName: string; entityTypes: { entityType: string }[] }[] {
		const groupedEntityTypes: { [key: string]: { entityType: string }[] } = {};

		// Filter based on selected countries
		const newArray = this.countryEntityTypeMapping.filter(item => this.selectedCountries.includes(item.countryName!));

		// Group entity types by country name
		newArray.forEach((item) => {
			if (!groupedEntityTypes[item.countryName!]) {
				groupedEntityTypes[item.countryName!] = [];
			}
			// Ensure entityType is included in the list
			groupedEntityTypes[item.countryName!].push({ entityType: item.entityType! });
		});

		// Convert the grouped data into an array format
		return Object.keys(groupedEntityTypes).map((countryName) => ({
			countryName,
			entityTypes: groupedEntityTypes[countryName],
		}));
	}

	searchCountry(event: any) {
		this.countryEntityTypeMapping.filter(mapping => {
			if (mapping.countryName && mapping.countryName.toLowerCase().includes(event.target.value.toLowerCase())) {
				mapping.hide = false; // Show the mapping if it matches the search term
				return true;
			} else {
				mapping.hide = true; // Hide the mapping if it doesn't match the search term
				return false;
			}
		});
	}

}
