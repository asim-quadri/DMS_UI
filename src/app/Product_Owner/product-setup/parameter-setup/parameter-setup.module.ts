import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ParameterSetupRoutingModule } from './parameter-setup-routing.module';
import { ParameterSetupComponent } from './parameter-setup/parameter-setup.component';
import { AddParameterSetupComponent } from './add-parameter-setup/add-parameter-setup.component';

import { ComponentsModule } from '../../../Components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridModule } from 'ag-grid-angular';
import { HeaderModule } from '../header/header.module';
import { ParameterApprovalComponent } from './parameter-approval/parameter-approval.component';
import { ReviewParameterComponent } from './review-parameter/review-parameter.component';

@NgModule({
  declarations: [
    ParameterSetupComponent,
    AddParameterSetupComponent,
    ParameterApprovalComponent,
    ReviewParameterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ParameterSetupRoutingModule,
    ComponentsModule,
    NgbModule,
    AgGridModule,
    HeaderModule
  ]
})
export class ParameterSetupModule { }
