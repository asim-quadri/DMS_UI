import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextComponent } from './input-text/input-text.component';
import { AgDeleteButtonComponent } from './ag-grid/ag-delete-button/ag-delete-button.component';
import { AgLinkButtonComponent } from './ag-grid/ag-link-button/ag-link-button.component';
import { AgbuttonComponent } from './ag-grid/agbutton/agbutton.component';
import { InputDateComponent } from './input-date/input-date.component';
import { InputDropdownComponent } from './input-dropdown/input-dropdown.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputPasswordComponent } from './input-password/input-password.component';
import { InputMultiselectComponent } from './input-multiselect/input-multiselect.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { TreeviewComponent } from './treeview/treeview.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTreeModule } from '@angular/material/tree';
import { ExpandableTextComponent } from './expandable-text/expandable-text.component';


@NgModule({
  declarations: [
    InputTextComponent,
    AgDeleteButtonComponent,
    AgbuttonComponent,
    InputDateComponent,
    InputDropdownComponent,
    AgLinkButtonComponent,
    InputPasswordComponent,
    InputMultiselectComponent,
    TreeviewComponent,
    ExpandableTextComponent,
  ],
  exports: [
    InputTextComponent,
    ExpandableTextComponent,
    AgDeleteButtonComponent,
    AgbuttonComponent,
    InputDateComponent,
    InputDropdownComponent,
    AgLinkButtonComponent,
    InputPasswordComponent,
    InputMultiselectComponent,
    TreeviewComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgMultiSelectDropDownModule.forRoot(),
    MatTreeModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatCheckboxModule
  ]
})
export class ComponentsModule { }
