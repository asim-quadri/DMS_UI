import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextComponent } from './input-text/input-text.component';
import { AgDeleteButtonComponent } from './ag-grid/ag-delete-button/ag-delete-button.component';
import { AgLinkButtonComponent } from './ag-grid/ag-link-button/ag-link-button.component';
import { AgbuttonComponent } from './ag-grid/agbutton/agbutton.component';
import { InputDateComponent } from './input-date/input-date.component';
import { InputDropdownComponent } from './input-dropdown/input-dropdown.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { InputPasswordComponent } from './input-password/input-password.component';
import { InputMultiselectComponent } from './input-multiselect/input-multiselect.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';



@NgModule({
  declarations: [
    AgDeleteButtonComponent,
    AgbuttonComponent,
    InputDateComponent,
    InputDropdownComponent,
    AgLinkButtonComponent,
    InputPasswordComponent,
    InputMultiselectComponent,
    InputTextComponent
  ],
  exports: [
    AgDeleteButtonComponent,
    AgbuttonComponent,
    InputDateComponent,
    InputDropdownComponent,
    AgLinkButtonComponent,
    InputPasswordComponent,
    InputMultiselectComponent,
    InputTextComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgMultiSelectDropDownModule.forRoot()
  ]
})
export class ComponentsModule { }
