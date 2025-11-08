import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-no-access',
  templateUrl: './no-access.component.html',
  styleUrls: ['./no-access.component.scss']
})
export class NoAccessComponent {
  pageName : string = 'this page';

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.pageName = params['pageName'] || 'this page';
    });
  }
}
