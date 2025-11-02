import { Component, OnInit, TemplateRef, inject } from '@angular/core';

import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { LoaderService } from '../Services/loader.service';
import { PersistenceService } from '../Services/persistence.service';
import { HeaderComponent } from './components/header/header.component';
import { SidemenuComponent } from './components/sidemenu/sidemenu.component';

@Component({
    selector: 'app-homepage',
    standalone: true,
    templateUrl: './homepage.component.html',
    styleUrl: './homepage.component.css',
    imports: [
      SidemenuComponent,
      HeaderComponent,
        NgbDropdownModule,
        FormsModule,
        CommonModule,
        NgbNavModule,
        FileUploadModule,
        RouterModule,
        ToastModule],
    providers: [MessageService]
})
export class HomeComponent  implements OnInit{
  showMenus: boolean = false;
  constructor(private persistance: PersistenceService,public loaderService: LoaderService) {
    // Check authentication more thoroughly
    this.checkAuthenticationState();
	}
  
  private checkAuthenticationState() {
    const currentUser = sessionStorage.getItem('currentUser');
    const userUID = this.persistance.getUserUID();
    
    console.log('Auth check - currentUser:', currentUser);
    console.log('Auth check - userUID:', userUID);
    
    if(!currentUser || currentUser === '{}' || !userUID){
      this.showMenus = false;
      // Don't auto logout on the homepage - let auth guard handle it
    }
    else{
      this.showMenus = true;
    }
  }
  ngOnInit(): void {
  }

}
