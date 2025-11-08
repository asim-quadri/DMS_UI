import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegulationGroupingComponent } from './regulation-grouping/regulation-grouping.component';

const routes: Routes = [
  { path: '', component: RegulationGroupingComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegulationGroupingSetupRoutingModule { }
