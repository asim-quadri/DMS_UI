import { Component } from '@angular/core';
import { PersistenceService } from '../../../Services/persistence.service';
import { CommonModule } from '@angular/common';
import { UserEntityService } from '../../../Services/userentity.service';
import { EntitiesCityCoordinate } from '../../../Models/userEntityModel';

@Component({
  selector: 'app-headernav',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [CommonModule],
  standalone:true
})
export class HeaderComponent {
  name:string='';
  entities: EntitiesCityCoordinate[] = [];

  constructor(
    private persistance: PersistenceService,
    private userEntityService: UserEntityService
  ){
    this.name = this.persistance.getUserName()
  }

  ngOnInit(): void {
    this.getAllEntityList();
  }

  logout(): void {
    this.persistance.logout();
  }

  getAllEntityList(){
    const organizationId = this.persistance.getOrganizationId();
    if (!organizationId) return;
    this.userEntityService.GetClientEntitiesLocations(organizationId).subscribe({
      next: (result: EntitiesCityCoordinate[]) => {
        this.entities = result || [];
      },
      error: (err: any) => {
        console.error('Error loading entities:', err);
      }
    });
  }

}
