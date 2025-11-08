import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { combineLatest } from 'rxjs';
const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'compliance-tracker',
        loadChildren: () => import('../client/compliance-tracker/compliance-tracker.module').then((m) => m.ComplianceTrackerModule)
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientRoutingModule { }
