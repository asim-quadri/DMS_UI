import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillingDetailsComponent } from './billing-details.component';

const routes: Routes = [
  { path: '', component: BillingDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BillingDetailsRoutingModule { }
