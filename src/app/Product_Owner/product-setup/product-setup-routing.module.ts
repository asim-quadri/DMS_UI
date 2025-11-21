import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CountrySetupModule } from './country-setup/country-setup.module';
import { AuthGuardService } from 'src/app/Services/auth-guard.service';
import { RegulationGroupingSetupModule } from './regulation-grouping-setup/regulation-grouping-setup.module';
import { IndustrySetupModule } from './industry-setup/industry-setup.module';
import { ParameterSetupModule } from './parameter-setup/parameter-setup.module';
import { EntityTypeSetupModule } from './entity-type-setup/entity-type-setup.module';
import { RegulationSetupModule } from './regulation-setup/regulation-setup.module';
import { BranchSetupModule } from './branch-setup/branch-setup.module';
import { RegulatoryAuthorityModule } from './regulatory-authority/regulatory-authority.module';
import { ConcernedMinistryComponent } from './concerned-ministry/concerned-ministry/concerned-ministry.component';
import { ConcernedMinistryModule } from './concerned-ministry/concerned-ministry-module';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'country',
        loadChildren: () =>
          import('../product-setup/country-setup/country-setup.module').then(
            (m) => m.CountrySetupModule
          ),
      },
      {
        path: 'industry',
        loadChildren: () =>
          import('../product-setup/industry-setup/industry-setup.module').then(
            (m) => m.IndustrySetupModule
          ),
      },
      {
        path: 'parameter',
        loadChildren: () =>
          import(
            '../product-setup/parameter-setup/parameter-setup.module'
          ).then((m) => m.ParameterSetupModule),
      },

      // { path: 'product',loadChildren: ()=> CountrySetupModule , canActivate:[AuthGuardService]},
      // { path: 'product',loadChildren: ()=> IndustrySetupModule , canActivate:[AuthGuardService]},
      // { path: 'product',loadChildren: ()=> ParameterSetupModule , canActivate:[AuthGuardService]},
      // { path: 'country', loadChildren: () => CountrySetupModule, canActivate: [AuthGuardService] },

      {
        path: 'regulation',
        loadChildren: () => RegulationGroupingSetupModule,
        canActivate: [AuthGuardService],
      },
      {
        path: 'entity',
        loadChildren: () => EntityTypeSetupModule,
        canActivate: [AuthGuardService],
      },
      {
        path: 'regulationsetup',
        loadChildren: () => RegulationSetupModule,
        canActivate: [AuthGuardService],
      },
      {
        path: 'branchsetup',
        loadChildren: () => BranchSetupModule,
        canActivate: [AuthGuardService],
      },
      {
        path: 'regulatoryauthority',
        loadChildren: () => RegulatoryAuthorityModule,
        canActivate: [AuthGuardService],
      },
      {
        path: 'concernedministry',
        loadChildren: () => ConcernedMinistryModule,
        canActivate: [AuthGuardService],
      },
      // {
      //   path: 'entity',
      //   loadChildren: () =>
      //     import('../product-setup/entity/entity.module').then((m) => m.EntityModule),
      // },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductSetupRoutingModule {}
