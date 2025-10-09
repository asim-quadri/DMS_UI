import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidemenu.component.html',
  styleUrls: ['./sidemenu.component.scss'],
  standalone: true
})
export class SidemenuComponent {
  constructor(private router: Router){

  }
navigatetoPage(navigateUrl: string) {
  this.router.navigate(['/home/'+ navigateUrl]).then(() => {
    location.reload();
  });
}


}
