import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EntityTypeComponent } from './entity-type/entity-type.component';


const routes: Routes = [
  { path: '', component: EntityTypeComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EntityTypeSetupRoutingModule { }
