import { Component } from '@angular/core';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
@Component({
  selector: 'app-organization',
  templateUrl: './organization-setup.component.html',
  styleUrls: ['./organization-setup.component.scss']
})
export class OrganizationSetupComponent {
  countryList :any[] = [];
	selectedItems :any[] = [];
	dropdownSettings: IDropdownSettings = {};
	ngOnInit() {
		this.countryList = [
			{ item_id: 1, item_text: 'India' },
			{ item_id: 2, item_text: 'USA' },
			{ item_id: 3, item_text: 'Canada' },
			{ item_id: 4, item_text: 'UK' },
			{ item_id: 5, item_text: 'NewZealend' }
		];
	
		this.dropdownSettings = {
			singleSelection: false,
			idField: 'item_id',
			textField: 'item_text',
			selectAllText: 'Select All',
			unSelectAllText: 'UnSelect All',
			itemsShowLimit: 2,
			allowSearchFilter: true
		};

	}
	closeResult = '';
}
