import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComplianceTrackerListComponent } from './compliance-tracker-list/compliance-tracker-list.component';

const routes: Routes = [
  { path: '', component: ComplianceTrackerListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComplianceTrackerRoutingModule { }
