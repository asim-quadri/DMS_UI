import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from 'src/app/Services/auth-guard.service';

const routes: Routes = [

  {
    path: '',
    children: [
      {
        path: 'organization',
        loadChildren: () =>
          import('../organization-setup/new-organization/new-organization.module').then((m) => m.NewOrganizationSetupModule),
      },
      {
        path: 'entity/:id',
        loadChildren: () =>
          import('../organization-setup/organization-entity/organization-entity.module').then((m) => m.OrganizationEntitySetupModule),
      },
      {
        path: 'entity-details/:entityId/:orgId',
        loadChildren: () =>
          import('../organization-setup/entity-details/entity-details.module').then((m) => m.EntityDetailsSetupModule),
      },
      {
        path: 'billing-details/:id/:entityId',
        loadChildren: () =>
          import('../organization-setup/billing-details/billing-details.module').then((m) => m.BillingDetailsSetupModule),
      },
      // { path: 'regulation', loadChildren: () => RegulationGroupingSetupModule, canActivate: [AuthGuardService] },
      // { path: 'entity',loadChildren: ()=> EntityTypeSetupModule , canActivate:[AuthGuardService]},
      // { path: 'regulationsetup', loadChildren: () => RegulationSetupModule, canActivate: [AuthGuardService] },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrganizationSetupRoutingModule { }
