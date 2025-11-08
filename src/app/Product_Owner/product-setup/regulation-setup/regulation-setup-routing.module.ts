import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddRagulationSetupComponent } from './add-ragulation-setup/ragulation-list.component';
import { RegulationSetupListComponent } from './regulation-setup-list/regulation-setup-home.component';


const routes: Routes = [
  { path: '', component: RegulationSetupListComponent},
  { path: '', component: AddRagulationSetupComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegulationSetupRoutingModule { }
