import { NgModule } from '@angular/core';
import { ParameterSetupComponent } from './parameter-setup/parameter-setup.component'
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: ParameterSetupComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParameterSetupRoutingModule { }
