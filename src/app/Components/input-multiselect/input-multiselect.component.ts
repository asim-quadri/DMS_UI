import { Component, EventEmitter, Input, Output, OnInit, AfterViewInit } from '@angular/core';
import { IDropdownSettings } from 'ng-multiselect-dropdown';

@Component({
  selector: 'app-input-multiselect',
  templateUrl: './input-multiselect.component.html',
  styleUrls: ['./input-multiselect.component.scss']
})
export class InputMultiselectComponent implements OnInit {

  dropdownList: any = [];
  @Input()
  selectedItems: any = [];
  dropdownSettings: IDropdownSettings = {};

  @Input()
  formGroup: any;

  @Input()
  name: any;

  @Input()
  placeholder: any;

  @Input()
  key: any;

  @Input()
  value: any;

  @Input()
  object: any;




  @Output()
  change: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  getSelectedItems: EventEmitter<any> = new EventEmitter<any>();


  ngOnInit() {

    this.dropdownSettings = {
      singleSelection: false,
      idField: this.key,
      textField: this.value,
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 2,
      allowSearchFilter: true
    };
  }
  onItemSelect(item: any) {

    //this.selectedItems.push(item);
    this.getSelectedItems.emit(this.selectedItems);
  }
  onSelectAll(items: any) {

    this.selectedItems = items;
    this.getSelectedItems.emit(this.selectedItems);
  }

  onItemDeSelect(item: any) {

    const index = this.selectedItems.findIndex((i: any) => i[this.key] === item[this.key]);;
    if (index !== -1) {
      this.selectedItems.splice(index, 1);
      
    }
    this.getSelectedItems.emit(this.selectedItems);
  }
  onItemsDeSelect(items: any) {

    this.getSelectedItems.emit([])
  }

  onchange(event: any) {
    this.change.emit(event);
  }
}
