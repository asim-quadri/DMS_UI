import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from './Product_Owner/auth/login/login.component';
import { ForgotPasswordComponent } from './Product_Owner/auth/forgot-password/forgot-password.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from './Product_Owner/components/header/header.component';
import { HomeComponent } from './Product_Owner/home/home.component';
import { SidemenuComponent } from './Product_Owner/components/sidemenu/sidemenu.component';
import { MatChipsModule } from '@angular/material/chips';
import { UsersComponent } from './Product_Owner/user_management/users/users.component';
import { AgGridModule } from 'ag-grid-angular';
import { ApiService } from './Services/api.service';
import { AppConfig } from './app.config';
import { UpdateUserComponent } from './Product_Owner/user_management/update-user/update-user.component';

import { RolesComponent } from './Product_Owner/user_management/userRoles/roles/roles.component';
import { UpdateRolesComponent } from './Product_Owner/user_management/userRoles/update-roles/update-roles.component';
import customNotifierOptions from './notifier.config';
import { NotifierModule } from 'angular-notifier';
import { RxReactiveFormsModule } from '@rxweb/reactive-form-validators';
import { AccessControlComponent } from './Product_Owner/user_management/access-control/access-control.component';
import { ApprovalControlComponent } from './Product_Owner/user_management/approval-control/approval-control.component';
import { ReviewUserComponent } from './Product_Owner/user_management/review-user/review-user.component';
import { PersistenceService } from './Services/persistence.service';
import { RoleApprovalComponent } from './Product_Owner/user_management/userRoles/role-approval/role-approval.component';
import { ReviewRoleComponent } from './Product_Owner/user_management/userRoles/review-role/review-role.component';
import { UserApprovalComponent } from './Product_Owner/user_management/user-approval/user-approval.component';
import { ComponentsModule } from './Components/components.module';
import { CountryService } from './Services/country.service';
import { ParameterService } from './Services/parameter.service';
import { OrganizationService } from './Services/organization.service';
import { EntityService } from './Services/entity.service';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

import { HttpRequestInterceptor } from './@core/utils/http-request-interceptor';
import { RouteReuseStrategy } from '@angular/router';
import { RouteReusableStrategy } from './@core/utils/route-reusable-strategy';
import { GlobalErrorHandler } from './@core/utils/global-error-handler';
import { RegulationGroupService } from './Services/regulation.service';
import { NgxLoadingModule } from 'ngx-loading';
import { CommonService } from './Services/common.service';
import { DatePipe, LocationStrategy, HashLocationStrategy } from '@angular/common';
import { OrganizationSetupComponent } from './Product_Owner/organization-setup/organization-setup.component';
import { BillingDetailsComponent } from './Product_Owner/organization-setup/billing-details/billing-details.component';
import { EntityDetailsComponent } from './Product_Owner/organization-setup/entity-details/entity-details.component';
import { NewOrganizationComponent } from './Product_Owner/organization-setup/new-organization/new-organization.component';
// import { OrganizationDetailsComponent } from './Product_Owner/organization-setup/organization-details/organization-details.component';
import { OrganizationEntityComponent } from './Product_Owner/organization-setup/organization-entity/organization-entity.component';
import { OrganizationVerticalnavComponent } from './Product_Owner/organization-setup/organization-verticalnav/organization-verticalnav.component';
import { TopNavComponent } from './Product_Owner/organization-setup/top-nav/top-nav.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceRequestComponent } from './Product_Owner/client/service-request/service-request.component';
import { MatIconModule } from '@angular/material/icon';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatTabsModule } from '@angular/material/tabs';
import { NoAccessComponent } from './Product_Owner/no-access/no-access.component';
import { OrganizationApprovalComponent } from './Product_Owner/organization-setup/organization-approval/organization-approval.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MapColorPipe } from './@core/pipes/map-color.pipe';
import { FilterPipe } from './@core/pipes/filter.pipe';
import { ReportListItemComponent } from './Product_Owner/Reports/report-list-item/report-list-item.component';
import { FileuploadComponent } from './fileupload/fileupload.component';
import { FileViewerComponent } from './file-viewer/file-viewer.component';
import { NgxDocViewerModule } from 'ngx-doc-viewer';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ForgotPasswordComponent,
    HeaderComponent,
    HomeComponent,
    SidemenuComponent,
    RolesComponent,
    UsersComponent,
    UpdateUserComponent,
    UpdateRolesComponent,
    AccessControlComponent,
    ApprovalControlComponent,
    ReviewUserComponent,
    UserApprovalComponent,
    RoleApprovalComponent,
    ReviewRoleComponent,
    OrganizationSetupComponent,
    BillingDetailsComponent,
    EntityDetailsComponent,
    NewOrganizationComponent,
    // OrganizationDetailsComponent,
    OrganizationEntityComponent,
    OrganizationVerticalnavComponent,
    TopNavComponent,
    ServiceRequestComponent,
    NoAccessComponent,
    OrganizationApprovalComponent,
    MapColorPipe,
    FilterPipe,
    ReportListItemComponent,
    FileuploadComponent,
    FileViewerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule,
    HttpClientModule,
    AgGridModule,
    ReactiveFormsModule,
    NotifierModule.withConfig(customNotifierOptions),
    NgMultiSelectDropDownModule.forRoot(),
    RxReactiveFormsModule,
    ComponentsModule,
    NgxLoadingModule.forRoot({}),
    BrowserAnimationsModule,
    MatIconModule,
    MatChipsModule,
    GoogleMapsModule,
    MatTabsModule,
    MatExpansionModule,
    NgxDocViewerModule
  ],
  providers: [
    AppConfig,
    ApiService,
    PersistenceService,
    CountryService,
    RegulationGroupService,
    ParameterService,
    OrganizationService,
    EntityService,
    CommonService,
    DatePipe,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpRequestInterceptor,
      multi: true,
    },
    {
      provide: RouteReuseStrategy,
      useClass: RouteReusableStrategy,
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
