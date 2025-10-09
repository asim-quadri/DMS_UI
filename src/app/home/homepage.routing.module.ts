import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './homepage.component';
import { EntityComponent } from './auth/entity/entity.component';
import { UsersComponent } from './user_management/users/users.component';
import { RolesComponent } from './user_management/userRoles/roles/roles.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: '', redirectTo: 'fileupload', pathMatch: 'full' },
      {
        path: 'fileupload',
        loadChildren: () => import('./fileupload/fileupload.module').then(m => m.FileuploadModule)
      },

      {path: 'entity',component:EntityComponent},
      {path: 'users',component:UsersComponent},
      {path: 'roles',component:RolesComponent},
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule {}
