import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EntityComponent } from './entity.component';



const routes: Routes = [
  {
    path: '',
    component: EntityComponent,
    data: {
      title: 'Compliance | Product-Setup> Entity',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EntityRoutingModule { }
