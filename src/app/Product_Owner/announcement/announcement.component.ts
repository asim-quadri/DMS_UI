import { Component } from '@angular/core';
import { MenuOptionModel } from 'src/app/Models/Users';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { NoAccessComponent } from '../no-access/no-access.component';

@Component({
    selector: 'app-service-request',
    templateUrl: './announcement.component.html',
    styleUrls: ['./announcement.component.scss']
    
})

export class AnnouncementComponent {
    showAnnouncement: boolean = true;

    constructor(
        private persistance: PersistenceService,
    ) { }


    ngOnInit() {
        var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');
        if (roleMenuOptions && roleMenuOptions.length > 0) {
            var menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 4);
            if (menuOptions.length > 0) {
                this.showAnnouncement = menuOptions.filter((option: MenuOptionModel) => option.title === 'View' && option.canView).length > 0;
            }
        }
    }

}