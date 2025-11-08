import { NgModule } from "@angular/core";
import { AddConcernedMinistryComponent } from "./add-concerned-ministry/add-concerned-ministry.component";
import { ApproveConcernedMinistryComponent } from "./approve-concerned-ministry/approve-concerned-ministry.component";
import { ConcernedMinistryComponent } from "./concerned-ministry/concerned-ministry.component";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { ConcernedMinistryRoutingModule } from "./concerned-ministry-routing.module";
import { HeaderModule } from "../header/header.module";
import { ComponentsModule } from "src/app/Components/components.module";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { AgGridModule } from "ag-grid-angular";

    @NgModule({
      declarations: [
        ConcernedMinistryComponent,
       ApproveConcernedMinistryComponent,
       AddConcernedMinistryComponent
      ],
      providers: [],
      imports: [
        CommonModule,
        ReactiveFormsModule,
        ConcernedMinistryRoutingModule,
        HeaderModule,
        ComponentsModule,
        NgbModule,
        AgGridModule,
      ]
    })
    
    export class ConcernedMinistryModule {
    }