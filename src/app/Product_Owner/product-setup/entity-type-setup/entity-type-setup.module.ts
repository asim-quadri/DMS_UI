import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeaderModule } from '../header/header.module';
import { ComponentsModule } from 'src/app/Components/components.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridModule } from 'ag-grid-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { AddEntityTypeComponent } from './add-entity-type/add-entity-type.component';
import { EntityTypeService } from 'src/app/Services/entityType.service';
import { EntityTypeComponent } from './entity-type/entity-type.component';
import { ApproveEntityTypeComponent } from './approve-entity-type/approve-entity-type.component';
import { EntityTypeSetupRoutingModule } from './entity-type-setup-routing.module';


@NgModule({
  declarations: [
    EntityTypeComponent,
    AddEntityTypeComponent,
    ApproveEntityTypeComponent
  ],
  providers: [EntityTypeService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EntityTypeSetupRoutingModule,
    HeaderModule,
    ComponentsModule,
    NgbModule,
    AgGridModule,
  ]
})
export class EntityTypeSetupModule { }
