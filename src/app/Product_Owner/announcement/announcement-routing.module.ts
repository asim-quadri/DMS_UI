import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnnouncementsComponent } from './announcements/announcements.component';
import { AddAnnouncementsComponent } from './add-announcements/add-announcements.component';
import { AuthGuardService } from 'src/app/Services/auth-guard.service';

const routes: Routes = [
  { path: '', component: AnnouncementsComponent, canActivate: [AuthGuardService] },
  { path: '', component: AddAnnouncementsComponent, canActivate: [AuthGuardService] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnnouncementRoutingModule { }
