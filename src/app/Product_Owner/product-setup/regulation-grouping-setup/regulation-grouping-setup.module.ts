import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegulationGroupingSetupRoutingModule } from './regulation-grouping-setup-routing.module';
import { RegulationGroupingComponent } from './regulation-grouping/regulation-grouping.component';
import { HeaderModule } from '../header/header.module';
import { AddRegulationComponent } from './add-regulation/add-regulation.component';
import { ApproveRegulationComponent } from './approve-regulation/approve-regulation.component';
import { ComponentsModule } from 'src/app/Components/components.module';
import { RegulationGroupService } from 'src/app/Services/regulation.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridModule } from 'ag-grid-angular';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    RegulationGroupingComponent,
    AddRegulationComponent,
    ApproveRegulationComponent
  ],
  providers: [RegulationGroupService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RegulationGroupingSetupRoutingModule,
    HeaderModule,
    ComponentsModule,
    NgbModule,
    AgGridModule,
  ]
})
export class RegulationGroupingSetupModule { }
