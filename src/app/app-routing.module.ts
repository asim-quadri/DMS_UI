import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './Product_Owner/auth/login/login.component';
import { ForgotPasswordComponent } from './Product_Owner/auth/forgot-password/forgot-password.component';
import { HomeComponent } from './Product_Owner/home/home.component';

import { UsersComponent } from './Product_Owner/user_management/users/users.component';
import { RolesComponent } from './Product_Owner/user_management/userRoles/roles/roles.component';
import { AuthGuardService } from './Services/auth-guard.service';
import { ProductSetupModule } from './Product_Owner/product-setup/product-setup.module';
import { IndustryListComponent } from './Product_Owner/product-setup/industry-setup/industry-list/industry-list.component';
import { ParameterSetupComponent } from './Product_Owner/product-setup/parameter-setup/parameter-setup/parameter-setup.component'
import { OrganizationSetupModule } from './Product_Owner/organization-setup/organization-setup.module';
import { ClientModule } from './Product_Owner/client/client.module';
import { ServiceRequestComponent } from './Product_Owner/client/service-request/service-request.component';
import { NoAccessComponent } from './Product_Owner/no-access/no-access.component';
import { AnnouncementComponent } from './Product_Owner/announcement/announcement.component';
import { ReportListItemComponent } from './Product_Owner/Reports/report-list-item/report-list-item.component';
import { AnnouncementModule } from './Product_Owner/announcement/announcement.module';
import { FileuploadComponent } from './fileupload/fileupload.component';
import { FileViewerComponent } from './file-viewer/file-viewer.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'forget', component: ForgotPasswordComponent },
  { path: 'home', component: FileuploadComponent, canActivate: [AuthGuardService] },
  { path: 'roles', component: RolesComponent, canActivate: [AuthGuardService] },
  { path: 'users', component: UsersComponent, canActivate: [AuthGuardService] },
  { path: 'announcement', component: AnnouncementComponent, canActivate: [AuthGuardService] },
  { path: 'industry', component: IndustryListComponent, canActivate:[AuthGuardService]},
  { path: 'service-request', component: ServiceRequestComponent, canActivate:[AuthGuardService]},
  { path: 'report-list', component: ReportListItemComponent, canActivate:[AuthGuardService]},
  { path: 'fileview', component: FileViewerComponent, canActivate:[AuthGuardService]},
  {
    path: 'product-setup',
    children: [
      {
        path: '',
        loadChildren: () => ProductSetupModule
          ,
      },
    ],
  },
  {
    path: 'client-setup',
    children: [
      {
        path: '',
        loadChildren: () => ClientModule
      },
    ],
  },
  {
    path: 'announcement',
    children: [
      {
        path: '',
        loadChildren: () => AnnouncementModule
      },
    ],
  },
  {
    path: 'organization-setup',
    children: [
      {
        path: '',
        loadChildren: () => OrganizationSetupModule
          ,
      },
    ],
  },
  { path: 'no-access/:pageName', component: NoAccessComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
