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
    // Check for auto-login parameter in URL first.
    // The app uses HashLocationStrategy, so query params live in the hash
    // (e.g. "#/home?autoLogin=..."), not window.location.search.
    const hash = window.location.hash;
    const hashQueryIndex = hash.indexOf('?');
    const queryString =
      hashQueryIndex >= 0 ? hash.substring(hashQueryIndex + 1) : window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const autoLoginData = urlParams.get('autoLogin');

    if (autoLoginData) {
      try {
        // URLSearchParams already decodes the value
        const userData = JSON.parse(autoLoginData);

        // Store in session storage
        this.persistance.setSessionStorage('currentUser', userData);

        console.log(
          'Auto-login successful, user data stored in session storage',
        );

        // Strip autoLogin from the hash but keep the route, then reload so all
        // components initialize with the session in place.
        const cleanHash = hashQueryIndex >= 0 ? hash.substring(0, hashQueryIndex) : hash;
        const cleanUrl = window.location.pathname + cleanHash;
        window.history.replaceState({}, document.title, cleanUrl);
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
