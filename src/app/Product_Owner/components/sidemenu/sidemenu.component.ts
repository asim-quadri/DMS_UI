import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface TopNavItem {
  id: number;
  title: string;
  route: string;
}

@Component({
  selector: 'app-sidemenu',
  templateUrl: './sidemenu.component.html',
  styleUrls: ['./sidemenu.component.scss']
})
export class SidemenuComponent implements OnInit {
  // Flat, top-level product navigation. (Previously an API-driven multi-item
  // vertical menu; simplified to these 3 fixed tabs per product decision.)
  menuItems: TopNavItem[] = [
    { id: 1, title: 'CompSeqr', route: '/client-setup/compliance-tracker' },
    { id: 2, title: 'ProEDox', route: '/home' },
    { id: 3, title: 'User Management', route: '/users' },
  ];

  constructor(private router: Router) {}

  ngOnInit() {}

  isMenuActive(item: TopNavItem): boolean {
    const currentUrl = this.router.url;

    if (item.title === 'User Management') {
      return currentUrl.includes('/users') || currentUrl.includes('/roles');
    }

    return currentUrl === item.route || currentUrl.startsWith(item.route + '/');
  }

  getIconClass(item: TopNavItem): string {
    const normalized = (item.title || '').toLowerCase();
    if (normalized.includes('compseqr')) {
      return 'bi-shield-check';
    }
    if (normalized.includes('proedox')) {
      return 'bi-folder2-open';
    }
    if (normalized.includes('user')) {
      return 'bi-people';
    }
    return 'bi-grid';
  }
}
