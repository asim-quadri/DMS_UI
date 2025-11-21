import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrganizationEntityComponent } from './organization-entity.component';

const routes: Routes = [
  { path: '', component: OrganizationEntityComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrganizationEntityRoutingModule { }