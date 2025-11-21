import { NgModule } from '@angular/core';
import { BranchListComponent } from '../../product-setup/branch-setup/branch-list/branch-list.component'
import { RouterModule, Routes } from '@angular/router';

const routes:Routes = [
  { path: '', component: BranchListComponent}
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchSetupRoutingModule { }
