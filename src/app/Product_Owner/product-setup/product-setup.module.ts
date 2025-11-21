import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductSetupRoutingModule } from './product-setup-routing.module';
import { ProductSetupComponent } from './product-setup.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import { AddRegulatoryAuthorityComponent } from './regulatory-authority/add-regulatory-authority/add-regulatory-authority.component';
import { ConcernedMinistryComponent } from './concerned-ministry/concerned-ministry/concerned-ministry.component';
import { ApproveConcernedMinistryComponent } from './concerned-ministry/approve-concerned-ministry/approve-concerned-ministry.component';
import { AddConcernedMinistryComponent } from './concerned-ministry/add-concerned-ministry/add-concerned-ministry.component';


@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    ProductSetupRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ProductSetupRoutingModule,
    NgbModule
  ]
})
export class ProductSetupModule { }
