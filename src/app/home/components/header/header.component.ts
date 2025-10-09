import { Component } from '@angular/core';
import { PersistenceService } from '../../../Services/persistence.service';
import { CommonModule } from '@angular/common';
import { EntityService } from '../../../Services/entity.service';
import { EntityModel } from '../../../models/entityModel';

@Component({
  selector: 'app-headernav',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [CommonModule],
  standalone:true
})
export class HeaderComponent {
  name:string='';
  entities: EntityModel[] = [];

  constructor(private persistance: PersistenceService,private entityService: EntityService,
  ){
    this.name = this.persistance.getUserName()
  }

  ngOnInit(): void {
    this.getAllEntityList();
  }
  getAllEntityList(){
    this.entityService.getAllEntityList().subscribe((result: any) => {
      result.forEach((element: any) => {
console.log("entities ==",result);
      });
      this.entities = result;
    });
  }

}
