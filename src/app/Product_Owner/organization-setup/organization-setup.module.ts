import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationSetupRoutingModule } from './organization-setup-routing.module';
import { NewOrganizationSetupModule } from './new-organization/new-organization.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { ComponentsModule } from 'src/app/Components/components.module';
import { OrganizationApprovalComponent } from './organization-approval/organization-approval.component';

@NgModule({

  imports: [
    CommonModule,
    OrganizationSetupRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    AgGridModule,
    ComponentsModule
    //NewOrganizationSetupModule
  ]
})
export class OrganizationSetupModule { }

