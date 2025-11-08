import { Component } from '@angular/core';
import { PersistenceService } from './Services/persistence.service';
import { LoaderService } from './Services/loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'compliancenew';
  showMenus:boolean =false;

  constructor(private persistance: PersistenceService,public loaderService: LoaderService) {

    if(this.persistance.getUserUID() == null){
      this.showMenus = false;
    }
    else{
      this.showMenus =true;
    }

	}
}
