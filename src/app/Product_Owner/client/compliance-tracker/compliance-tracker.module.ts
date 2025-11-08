import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ComplianceTrackerRoutingModule } from './compliance-tracker-routing.module';
import { ComplianceTrackerListComponent } from './compliance-tracker-list/compliance-tracker-list.component';
import { HeaderModule } from '../header/header.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule } from 'src/app/Components/components.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridModule } from 'ag-grid-angular';


@NgModule({
  declarations: [ComplianceTrackerListComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ComplianceTrackerRoutingModule,
    ComponentsModule,
    NgbModule,
    AgGridModule,
    HeaderModule
  ]
})
export class ComplianceTrackerModule { }
