import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntityDetailsRoutingModule } from './entity-details.routing.module';
import { InputDateComponent } from 'src/app/Components/input-date/input-date.component';
import { ComponentsModule } from 'src/app/Components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridModule } from 'ag-grid-angular';

@NgModule({
  declarations: [ ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    NgbModule,
    AgGridModule,
    EntityDetailsRoutingModule
  ]
})
export class EntityDetailsSetupModule { }
