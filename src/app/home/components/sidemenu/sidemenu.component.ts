import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { PersistenceService } from '../../../Services/persistence.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidemenu.component.html',
  styleUrls: ['./sidemenu.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive]
})
export class SidemenuComponent {
  constructor(private router: Router, private persistenceService: PersistenceService){

  }
navigatetoPage(navigateUrl: string) {
  this.router.navigate(['/home/'+ navigateUrl]).then(() => {
    location.reload();
  });
}

logout(event: Event) {
  event.preventDefault();
  this.persistenceService.logout();
}


}
