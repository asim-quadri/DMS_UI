import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegulationSetupRoutingModule } from './regulation-setup-routing.module';


import { ComponentsModule } from '../../../Components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridModule } from 'ag-grid-angular';
import { HeaderModule } from '../header/header.module';
import { RegulationSetupListComponent } from './regulation-setup-list/regulation-setup-home.component';
import { AddRagulationSetupComponent } from './add-ragulation-setup/ragulation-list.component';
import { AddComplianceComponent } from './add-compliance/add-compliance.component';
import { ParameterComponent } from './parameter/parameter.component';
import { RegulationApprovalComponent } from './regulation-approval/regulation-approval.component';
import { ReviewComplianceComponent } from './review-compliance/review-compliance.component';
import { TocSetupComponent } from './TOC/toc-setup/toc-setup.component';
import { TocRegistrationComponent } from './TOC/toc-registration/toc-registration.component';
import { TocRulesComponent } from './TOC/toc-rules/toc-rules.component';
import { TocReviewComponent } from './TOC/toc-review/toc-review.component';
import { ApproveRegulationSetupComponent } from './approve-regulation-setup/approve-regulation-setup.component';
import { ReviewRegulationSetupComponent } from './review-regulation-setup/review-regulation-setup.component';

@NgModule({
  declarations: [
    AddRagulationSetupComponent,
    RegulationSetupListComponent,
    AddComplianceComponent,
    ParameterComponent,
    ApproveRegulationSetupComponent,
    ReviewRegulationSetupComponent,
    ParameterComponent,
    RegulationApprovalComponent,
    ReviewComplianceComponent,
    TocSetupComponent,
    TocRegistrationComponent,
    TocRulesComponent,
    TocReviewComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RegulationSetupRoutingModule,
    ComponentsModule,
    NgbModule,
    AgGridModule,
    HeaderModule,
   

  ]
})
export class RegulationSetupModule { }
