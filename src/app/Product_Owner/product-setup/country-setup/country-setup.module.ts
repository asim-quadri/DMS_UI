import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CountrySetupRoutingModule } from './country-setup-routing.module';
import { CountryListComponent } from './country-list/country-list.component';
import { AddCountryComponent } from './add-country/add-country.component';
import { AddStateComponent } from './add-state/add-state.component';


import { ComponentsModule } from 'src/app/Components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApprovalCountrystateComponent } from './approval-countrystate/approval-countrystate.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridModule } from 'ag-grid-angular';
import { HeaderModule } from '../header/header.module';
import { SelectDropDownModule } from 'ngx-select-dropdown';




@NgModule({
  declarations: [
    CountryListComponent,
    AddCountryComponent,
    AddStateComponent,
    ApprovalCountrystateComponent,
    
  ],
  imports: [
    CommonModule,
    SelectDropDownModule,
    FormsModule,
    ReactiveFormsModule,
    CountrySetupRoutingModule,
    ComponentsModule,
    NgbModule,
    AgGridModule,
    HeaderModule
  ]
})
export class CountrySetupModule { }
