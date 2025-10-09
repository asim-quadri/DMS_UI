import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ForgotPasswordComponent } from './home/auth/forgot-password/forgot-password.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SidemenuComponent } from './home/components/sidemenu/sidemenu.component';

import { UsersComponent } from './home/user_management/users/users.component';
import { ApiService } from './Services/api.service';
import { FolderService } from './Services/folder.service';
import { AppConfig } from './app.config';
import { UpdateUserComponent } from './home/user_management/update-user/update-user.component';



import { RolesComponent } from './home/user_management/userRoles/roles/roles.component';
import { UpdateRolesComponent } from './home/user_management/userRoles/update-roles/update-roles.component';
import customNotifierOptions from './notifier.config';
import { NotifierModule  } from 'angular-notifier';
import { RxReactiveFormsModule } from '@rxweb/reactive-form-validators';
import { AccessControlComponent } from './home/user_management/access-control/access-control.component';
import { ApprovalControlComponent } from './home/user_management/approval-control/approval-control.component';
import { ReviewUserComponent } from './home/user_management/review-user/review-user.component';
import { PersistenceService } from './Services/persistence.service';
import { RoleApprovalComponent } from './home/user_management/userRoles/role-approval/role-approval.component';
import { ReviewRoleComponent } from './home/user_management/userRoles/review-role/review-role.component';
import { UserApprovalComponent } from './home/user_management/user-approval/user-approval.component';
import { ComponentsModule } from './Components/components.module';
import { CountryService } from './Services/country.service';
import { ParameterService } from './Services/parameter.service';
import { OrganizationService } from './Services/organization.service';
import { EntityService } from './Services/entity.service';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { EntityComponent } from './home/auth/entity/entity.component';

import { HttpRequestInterceptor } from './@core/utils/http-request-interceptor';
import { RegulationGroupService } from './Services/regulation.service';
import { NgxLoadingModule } from 'ngx-loading';
import { CommonService } from './Services/common.service';
import { DatePipe } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { LoginComponent } from './home/auth/login/login.component';
import { NewOrganizationSetupModule } from './home/components/new-organization/new-organization.module';
import { NewOrganizationComponent } from './home/components/new-organization/new-organization.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ForgotPasswordComponent,
    RolesComponent,
    UsersComponent,
    AccessControlComponent,
    ApprovalControlComponent,
    ReviewUserComponent,
    UpdateUserComponent,
    UpdateRolesComponent,
    UserApprovalComponent,
    RoleApprovalComponent,
    ReviewRoleComponent,
    NewOrganizationComponent,EntityComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    NotifierModule.withConfig(customNotifierOptions),
    NgMultiSelectDropDownModule.forRoot(),
    RxReactiveFormsModule,
    ComponentsModule,
    NgxLoadingModule.forRoot({}),
    AgGridModule,
    SidemenuComponent,
    ComponentsModule,
    NewOrganizationSetupModule
],
  providers: [AppConfig,ApiService,FolderService, PersistenceService, CountryService,RegulationGroupService,ParameterService,OrganizationService,EntityService,CommonService,DatePipe,{
    provide: HTTP_INTERCEPTORS,
    useClass: HttpRequestInterceptor,
    multi: true,
  },
  // {
  //   provide: RouteReuseStrategy,
  //   useClass: RouteReusableStrategy,
  // },
  // {
  //   provide: ErrorHandler,
  //   useClass: GlobalErrorHandler,
  // },
],
  bootstrap: [AppComponent]
})
export class AppModule { }
