import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnouncementRoutingModule } from './announcement-routing.module';
import { AnnouncementsComponent } from './announcements/announcements.component';
import { AddAnnouncementsComponent } from './add-announcements/add-announcements.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AgGridModule } from 'ag-grid-angular';
import { AnnouncementApprovalComponent } from './announcement-approval/announcement-approval.component';
import { ComponentsModule } from 'src/app/Components/components.module';
import { AnnouncementComponent } from './announcement.component';


@NgModule({
  declarations: [
    AnnouncementsComponent,
    AnnouncementComponent,
    AddAnnouncementsComponent,
    AnnouncementApprovalComponent
  ],
  imports: [
    CommonModule,
    AnnouncementRoutingModule,
    NgbModule,
    FormsModule,
    HttpClientModule,
    AgGridModule,
    ReactiveFormsModule,
    ComponentsModule
  ]
})
export class AnnouncementModule { }



