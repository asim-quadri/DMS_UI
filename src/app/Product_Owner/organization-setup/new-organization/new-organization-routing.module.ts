import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewOrganizationComponent } from './new-organization.component';

const routes: Routes = [
  { path: '', component: NewOrganizationComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NewOrganizationRoutingModule { }
