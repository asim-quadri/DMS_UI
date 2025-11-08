import { Component } from '@angular/core';

@Component({
  selector: 'app-product-setup',
  templateUrl: './product-setup.component.html',
  styleUrls: ['./product-setup.component.scss'],
})
export class ProductSetupComponent {
  countryList: any[] = [];
  stateList: any[] = [];
  entitytype: any[] = [];
  dropdownSettings: IDropdownSettings = {};
  statedropdownSettings: IDropdownSettings = {};

  ngOnInit() {
    this.countryList = [
      { item_id: 1, item_text: 'Mumbai' },
      { item_id: 2, item_text: 'Bangaluru' },
      { item_id: 3, item_text: 'Pune' },
      { item_id: 4, item_text: 'Navsari' },
      { item_id: 5, item_text: 'New Delhi' },
    ];
    this.entitytype = [
      { item_id: 1, item_text: 'Pvt Ltd Company' },
      { item_id: 2, item_text: 'Limited Company' },
    ];
    this.stateList = [
      { item_id: 1, item_text: 'Maharashtra' },
      { item_id: 2, item_text: 'Telangana' },
      { item_id: 3, item_text: 'Karnataka' },
      { item_id: 4, item_text: 'Tamil Nadu' },
      { item_id: 5, item_text: 'Kerala' },
      { item_id: 6, item_text: 'Maharashtra' },
      { item_id: 7, item_text: 'Telangana' },
      { item_id: 8, item_text: 'Karnataka' },
      { item_id: 9, item_text: 'Tamil Nadu' },
      { item_id: 10, item_text: 'Kerala' },
    ];
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 2,
      allowSearchFilter: false,
    };
    this.statedropdownSettings = {
      singleSelection: true,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 2,
      allowSearchFilter: true,
    };
  }
  closeResult = '';

  constructor() {}
}
export interface IDropdownSettings {
  singleSelection?: boolean;
  idField?: string;
  textField?: string;
  disabledField?: string;
  enableCheckAll?: boolean;
  selectAllText?: string;
  unSelectAllText?: string;
  allowSearchFilter?: boolean;
  clearSearchFilter?: boolean;
  maxHeight?: number;
  itemsShowLimit?: number;
  limitSelection?: number;
  searchPlaceholderText?: string;
  noDataAvailablePlaceholderText?: string;
  noFilteredDataAvailablePlaceholderText?: string;
  closeDropDownOnSelection?: boolean;
  showSelectedItemsAtTop?: boolean;
  defaultOpen?: boolean;
  allowRemoteDataSearch?: boolean;
}
export declare class ListItem {
  id: String | number;
  text: String | number;
  isDisabled?: boolean;
  constructor(source: any);
}
