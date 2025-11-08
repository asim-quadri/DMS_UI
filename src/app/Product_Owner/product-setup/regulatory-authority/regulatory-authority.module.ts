import { CommonModule } from "@angular/common";
import { NgModel, ReactiveFormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { ComponentsModule } from "src/app/Components/components.module";
import { HeaderModule } from "../header/header.module";
import { AgGridModule } from "ag-grid-angular";
import { NgModule } from "@angular/core";
import { RegulatoryAuthorityRoutingModule } from "./regulatory-authority-routing.module";
import { AddRegulatoryAuthorityComponent } from "./add-regulatory-authority/add-regulatory-authority.component";
import { RegulatoryAuthorityComponent } from './regulatory-authority/regulatory-authority.component';
import { ApproveRegulatoryAuthorityComponent } from './approve-regulatory-authority/approve-regulatory-authority.component';

@NgModule({
  declarations: [
  AddRegulatoryAuthorityComponent,
  RegulatoryAuthorityComponent,
  ApproveRegulatoryAuthorityComponent
  ],
  providers: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RegulatoryAuthorityRoutingModule,
    HeaderModule,
    ComponentsModule,
    NgbModule,
    AgGridModule,
  ]
})

export class RegulatoryAuthorityModule { 
   
    
}