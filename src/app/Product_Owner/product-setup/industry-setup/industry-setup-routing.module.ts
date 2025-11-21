import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndustryListComponent } from './industry-list/industry-list.component';

const routes: Routes = [
  { path: '', component: IndustryListComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IndustrySetupRoutingModule { }
