import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridModule } from 'ag-grid-angular';
import { ComponentsModule } from '../../../Components/components.module';
import { NewOrganizationRoutingModule } from './new-organization-routing.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    NgbModule,
    AgGridModule,
    NewOrganizationRoutingModule
  ]
})
export class NewOrganizationSetupModule { }
