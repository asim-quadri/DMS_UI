import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntityComponent } from './entity.component';
import { EntityRoutingModule } from './entity-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { AutoFocusModule } from 'src/app/@core/directives/autofocus.directive';
import { HeaderModule } from '../header/header.module';

@NgModule({
  declarations: [EntityComponent],
  imports: [
    CommonModule,
    EntityRoutingModule,
    FormsModule,
    NgbModule,
    NgMultiSelectDropDownModule,
    ReactiveFormsModule,
    AutoFocusModule,
    HeaderModule
  ],
})
export class EntityModule {}
