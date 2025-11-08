import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeaderRoutingModule } from './header-routing.module';
import { HeaderMenusComponent } from './header-menus/header-menus.component';


@NgModule({
  declarations: [
    HeaderMenusComponent
  ],
  exports: [
    HeaderMenusComponent
  ],
  imports: [
    CommonModule,
    HeaderRoutingModule
  ]
})
export class HeaderModule { }
