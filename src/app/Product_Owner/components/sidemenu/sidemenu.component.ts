import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/Services/api.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { MenuOptionModel } from 'src/app/Models/Users';

interface MenuImageMeta {
  alt: string;
  url: string;
}

@Component({
  selector: 'app-sidemenu',
  templateUrl: './sidemenu.component.html',
  styleUrls: ['./sidemenu.component.scss']
})
export class SidemenuComponent implements OnInit {
  menuItems: (MenuOptionModel & { imgUrl?: string; imgAlt?: string })[] = [];

  // Image metadata array
  imageMeta: MenuImageMeta[] = [
    { alt: 'Home', url: 'assets/images/home.svg' },
    { alt: 'Product Setup', url: 'assets/images/product-setup.svg' },
    { alt: 'Organization', url: 'assets/images/organization.svg' },
    { alt: 'Announcements', url: 'assets/images/announcements.svg' },
    { alt: 'User Management', url: 'assets/images/user-management.svg' },
    { alt: 'Roles', url: 'assets/images/user-management.svg' },
    { alt: 'Service Requests', url: 'assets/images/icons/service-requests.svg' },
    { alt: 'Reports', url: 'assets/images/icons/reports.svg' },
  ];

  isCollapsed = false;

  constructor(
    private apiService: ApiService,
    private persistenceService: PersistenceService,
    private router: Router
  ) {
    this.menuItems = [];
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  isMenuActive(item: any): boolean {
    const currentUrl = this.router.url;
    
    if (item.title === 'User Management') {
      return currentUrl.includes('/users') || currentUrl.includes('/roles');
    }
    
    return currentUrl === item.route || currentUrl.startsWith(item.route + '/');
  }

  logout() {
    this.persistenceService.logout();
  }

  ngOnInit() {
    // Fetch menu items for role 
    const roleId = this.persistenceService.getRoleId();
    const userId = this.persistenceService.getUserId();
    if (!roleId || !userId) {
      console.error('Role ID or User ID is not set in persistence service.');
      return;
    }
    this.apiService.getMenu(roleId, userId).subscribe((data: any[]) => {
      // Filter menu items if parentId is null or zero
      const filteredMenu:any = [];
      //data.filter(item => !item.parentId || item.parentId === 0);

      // Always add Home menu item by default
      const homeExists = filteredMenu.some((item:any) => item.title === 'Home');
      if (!homeExists) {
        filteredMenu.unshift({
          id: 1000, // Use a unique ID
          title: 'Home',
          route: '/home',
          parentId: 0,
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true
        });
      }

      // Always add User Management menu item by default
      const userManagementExists = filteredMenu.some((item:any) => item.title === 'User Management');
      if (!userManagementExists) {
        filteredMenu.push({
          id: 999, // Use a unique ID
          title: 'User Management',
          route: '/users',
          parentId: 0,
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true
        });
      }

      // Always add Roles menu item by default
      // const rolesExists = filteredMenu.some(item => item.title === 'Roles');
      // if (!rolesExists) {
      //   filteredMenu.push({
      //     id: 998, // Use a unique ID
      //     title: 'Roles',
      //     route: '/roles',
      //     parentId: 0,
      //     canView: true,
      //     canAdd: true,
      //     canEdit: true,
      //     canDelete: true
      //   });
      // }

      // Map menu items to include image URL and alt
      this.menuItems = filteredMenu.map((item:any) => {
        const img = this.imageMeta.find(meta => meta.alt === item.title);
        return {
          ...item,
          imgUrl: img ? img.url : '',
          imgAlt: img ? img.alt : item.title
        };
      });

      this.persistenceService.setSessionStorage('menuOptions', data); 
    });
  }
}