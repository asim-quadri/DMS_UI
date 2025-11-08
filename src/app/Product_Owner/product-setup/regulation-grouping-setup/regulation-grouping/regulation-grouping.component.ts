import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { NotifierService } from 'angular-notifier';
import { Observable } from 'rxjs';
import { CountryModel } from 'src/app/Models/countryModel';
import { RegulationGroupModel } from 'src/app/Models/regulationGroupModel';
import { MenuOptionModel } from 'src/app/Models/Users';
import { CountryService } from 'src/app/Services/country.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { RegulationGroupService } from 'src/app/Services/regulation.service';

@Component({
	selector: 'app-regulation-grouping',
	templateUrl: './regulation-grouping.component.html',
	styleUrls: ['./regulation-grouping.component.scss']
})
export class RegulationGroupingComponent implements OnInit {
	selectedCountries: string[] = [];
	closeResult = '';
	active = 8;
	countries: CountryModel[] = [];
	regulation: RegulationGroupModel[] = [];
	countryRegulationMapping: RegulationGroupModel[] = [];
	showAddButton: boolean = false;
	showAddNewRegulationGroupButton: boolean = false;
	showApprovalButton: boolean = false;
	regulationGroupApprovalCount: string = '.';

	searchCountryText: string = '';
	searchRegulationGroupText: string = '';
	constructor(private modalService: NgbModal, private fb: FormBuilder, private notifier: NotifierService, public countryService: CountryService, public regulationService: RegulationGroupService, private persistance: PersistenceService) { }

	formgroup: FormGroup = this.fb.group({
		countryId: ['', [
			RxwebValidators.required({ message: 'Country is required' })
		]],
		regulationGroupId: ['', [
			RxwebValidators.required({ message: 'Regulation Group is required' })
		]],
	});

	ngOnInit(): void {
		this.getCountries();
		this.getRegulationGroups();
		this.getCountrRegulationGroupMapping();

		var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');      
		if (roleMenuOptions && roleMenuOptions.length > 0) {
			//get menu options for for parentId = 13
			var menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 13);
			console.log('Country setup Menu Options:', menuOptions);     
			if (menuOptions.length > 0) {
				this.showAddButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Add' && option.canView).length > 0;
				this.showAddNewRegulationGroupButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Add New Country' && option.canView).length > 0;
				this.showApprovalButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'APPROVALS' && option.canView).length > 0;
			}
		}
	}

	getCountries() {
		this.countryService.getAllCountries().subscribe((result: any) => {
			this.countries = result;
		});
	}

	getRegulationGroups() {
		this.regulationService.getAllRegulationGroups().subscribe((result: any) => {
			this.regulation = result;

		});
	}

	getDropdownSelectedStates(regulation: any) {
		console.log(regulation);
		this.formgroup.patchValue({
			regulationGroupId: regulation
		});
		this.formgroup.updateValueAndValidity();
	}

	addCountryRegulation(event: any) {

		if (this.formgroup.valid) {

			var sourece: Observable<any>[] = [];

			this.formgroup.get('regulationGroupId')!.value.forEach((param: any) => {
				var request: any = {};
				request.countryId = this.formgroup.get('countryId')!.value
				request.regulationGroupId = param.id
				request.managerId = this.persistance.getManagerId()!;
				request.createdBy = this.persistance.getUserId()!;
				sourece.push(this.regulationService.postCountryRegulationGroupMapping(request));
			});

			if (sourece.length > 0) {
				this.regulationService.multipleAPIRequests(sourece).subscribe((result: any) => {

					var responseCode1States: any = [];
					var responseCode0States: any = [];
					let allResponseCode1 = true;

					result.forEach((item: any) => {
						if (item.responseCode === 0) {
							responseCode0States.push(item.regulationGroupName);
						} else {
							allResponseCode1 = false;
							responseCode1States.push(item.regulationGroupName);
						}
					});

					if (responseCode0States.length == 0) {
						this.reload('reload');
						this.formgroup.reset();
						this.notifier.notify("success", 'Regulation Group ' + responseCode1States.join(', ') + ' Mapped Successfully');
					} else {
						this.notifier.notify("error", 'Regulation Group ' + responseCode0States.join(', ') + ' already exists');
					}
				});
			}













			// var request: RegulationGroupModel = { ... this.formgroup.value }
			// request.managerId = this.persistance.getManagerId()!;
			// request.createdBy = this.persistance.getUserId()!;
			// this.regulationService.postCountryRegulationGroupMapping(request).subscribe({
			// 	next: (result: RegulationGroupModel) => {
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

	getCountrRegulationGroupMapping() {
		this.regulationService.getCountryRegulationGroupMapping().subscribe((result: RegulationGroupModel[]) => {
			this.countryRegulationMapping = result;
			if (this.countryRegulationMapping.length > 0)
				this.toggleSelection(this.countryRegulationMapping[0].countryName?.toString()!);
		});
	}

	getUniqueCountries() {
		var newArray = [...new Map(this.countryRegulationMapping.map((item: RegulationGroupModel) =>
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

	getSelectedRegulationGroups(): { countryName: string; regulationGroups: { regulationGroupName: string }[] }[] {
		const groupedRegulations: { [key: string]: { regulationGroupName: string }[] } = {};

		// Filter based on selected countries
		const newArray = this.countryRegulationMapping.filter(item => this.selectedCountries.includes(item.countryName!))!;


		// Group regulation groups by country name
		newArray.forEach((item) => {
			if (!groupedRegulations[item.countryName!]) {
				groupedRegulations[item.countryName!] = [];
			}
			groupedRegulations[item.countryName!].push({ regulationGroupName: item.regulationGroupName! });
		});

		// Convert the grouped data into an array format
		return Object.keys(groupedRegulations).map((countryName) => ({
			countryName,
			regulationGroups: groupedRegulations[countryName],
		}));
	}

	// getSelectedRegulationGroups() {
	// 	var newArray = this.countryRegulationMapping.filter(item => this.selectedCountries.includes(item.countryName!));
	// 	if (this.searchRegulationGroupText != "")
	// 		return newArray.filter(item => !item.hide);
	// 	else
	// 		return newArray
	// }
	searchCountry(event: any) {
		this.countryRegulationMapping.filter(mapping => {
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
