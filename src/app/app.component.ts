import { Component, OnInit } from '@angular/core';
import { PersistenceService } from './Services/persistence.service';
import { LoaderService } from './Services/loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'compliancenew';
  showMenus: boolean = false;

  constructor(
    private persistance: PersistenceService,
    public loaderService: LoaderService,
  ) {
    // Check for auto-login parameter in URL first
    const urlParams = new URLSearchParams(window.location.search);
    const autoLoginData = urlParams.get('autoLogin');

    if (autoLoginData) {
      try {
        const userData = JSON.parse(decodeURIComponent(autoLoginData));

        // Store in session storage
        this.persistance.setSessionStorage('currentUser', userData);

        console.log(
          'Auto-login successful, user data stored in session storage',
        );

        // Remove the parameter from URL and reload to ensure all components initialize properly
        const url = window.location.pathname;
        window.history.replaceState({}, document.title, url);
        window.location.reload();
        return;
      } catch (error) {
        console.error('Error parsing auto-login data:', error);
      }
    }

    if (this.persistance.getUserUID() == null) {
      this.showMenus = false;
    } else {
      this.showMenus = true;
    }
  }

  ngOnInit() {}
}
