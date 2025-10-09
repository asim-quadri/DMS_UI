import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileuploadComponent } from './fileupload.component';
import { FileUploadRoutingModule } from './fileupload-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';

@NgModule({
  imports: [
    CommonModule,
    FileUploadRoutingModule,
    FormsModule,
    AgGridModule,
    ReactiveFormsModule
  ],
  declarations: [FileuploadComponent]
})
export class FileuploadModule { }
