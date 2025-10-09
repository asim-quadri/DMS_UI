import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './home/auth/login/login.component';
import { ForgotPasswordComponent } from './home/auth/forgot-password/forgot-password.component';
import { NewOrganizationComponent } from './home/components/new-organization/new-organization.component';

const routes: Routes = [
  {
    path: 'home',
    //canActivate: [AuthGuardService],
    loadChildren: () => import('./home/homepage.module').then(m => m.HomepageModule)
  },
  { path: 'login', component: LoginComponent },
  {
    path: 'register-organization',
    component: NewOrganizationComponent
  },
  { path: 'forget', component: ForgotPasswordComponent },
  { path: '**', redirectTo: 'login' } // Redirect to login for any unknown routes
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
