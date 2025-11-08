import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/Services/api.service';
import { HeaderMenuItem } from 'src/app/Models/HeaderMenuItem';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { MenuOptionModel } from 'src/app/Models/Users';

@Component({
  selector: 'app-header-menus',
  templateUrl: './header-menus.component.html',
  styleUrls: ['./header-menus.component.scss']
})
export class HeaderMenusComponent implements OnInit {

  @Input()
  active: number = 1;

  menuItems: MenuOptionModel[] = [];

  constructor(private apiService: ApiService, private persistenceService: PersistenceService) { }


  ngOnInit() {
    const userId = this.persistenceService.getUserId() || 0;
    if (this.persistenceService.getRole() === 'SuperAdmin') {
      var roleMenuOptions = this.persistenceService.getSessionStorage('menuOptions');
      console.log('user ID:', roleMenuOptions);
      if (roleMenuOptions && roleMenuOptions.length > 0) {
        var menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 2);
        console.log('Product setup Menu Options:', menuOptions);
        if (menuOptions.length > 0) {
          this.menuItems = menuOptions;
        }
      }
    }
    else {
      this.apiService.getHeaderMenus(userId).subscribe((data: HeaderMenuItem[]) => {
        //get items for only country setup
        this.menuItems = data.filter(item => item.parentId === 2 && item.hasAccess).map(item => {
          return {
            id: item.id,
            menuId: item.id, // or use item.menuId if available
            title: item.title || '', // or use item.title if available
            parentId: item.parentId,
            icon: item.icon,
            canView: item.hasAccess,
            route: item.route || '',
            sortOrder: item.sortOrder || 0
          } as MenuOptionModel;
        });
        console.log('Product setup Menu Options:', this.menuItems);
      });
    }
  }
}
