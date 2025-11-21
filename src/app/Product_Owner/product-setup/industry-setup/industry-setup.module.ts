import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IndustrySetupRoutingModule } from './industry-setup-routing.module';
import { IndustryListComponent } from './industry-list/industry-list.component';
import { AddMajorIndustryComponent } from './add-major-industry/add-major-industry.component';
import { AddMinorIndustryComponent } from './add-minor-industry/add-minor-industry.component';


import { InputDateComponent } from '../../../Components/input-date/input-date.component';
import { ComponentsModule } from '../../../Components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ApprovalCountrymajorIndustryComponent } from './approval-countrymajor-industry/approval-countrymajor-industry.component';
import { ApprovalMajorminorIndustryComponent } from './approval-majorminor-industry/approval-majorminor-industry.component';
import { AgGridModule } from 'ag-grid-angular';
import { HeaderModule } from '../header/header.module';


@NgModule({
  declarations: [
    IndustryListComponent,
    AddMajorIndustryComponent,
    AddMinorIndustryComponent,
    ApprovalCountrymajorIndustryComponent,
    ApprovalMajorminorIndustryComponent,
  
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IndustrySetupRoutingModule,
    ComponentsModule,
    NgbModule,
    AgGridModule,
    HeaderModule
  ]
})
export class IndustrySetupModule { }
