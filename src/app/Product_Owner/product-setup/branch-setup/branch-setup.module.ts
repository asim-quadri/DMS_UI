import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BranchSetupRoutingModule } from './branch-setup-routing.module'
import { AddBranchSetupComponent } from './add-branch-setup/add-branch-setup.component'
import { BranchListComponent } from './branch-list/branch-list.component';
import { ApprovalBranchSetupComponent } from './approval-branch-setup/approval-branch-setup.component';

import { ComponentsModule } from '../../../Components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridModule } from 'ag-grid-angular';
import { HeaderModule } from '../header/header.module';

@NgModule({
  declarations: [
    BranchListComponent,
    AddBranchSetupComponent,
    ApprovalBranchSetupComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    BranchSetupRoutingModule,
    ComponentsModule,
    NgbModule,
    AgGridModule,
    HeaderModule
  ]
})
export class BranchSetupModule { }
