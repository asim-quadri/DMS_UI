import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfig } from '../app.config';
import { clientEntitesLocation, EntitiesCityCoordinate } from '../Models/userEntityModel';
import { forkJoin, BehaviorSubject, of, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { accessModel } from '../Models/pendingapproval';

@Injectable({
  providedIn: 'root',
})
export class UserEntityService {
  private selectedEntitySource: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );
  private entitiesSource: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private entitiesLoadedForOrg: any = null;

  /** Shared, app-wide entity context: one source of truth for "which entity is the user working in". */
  entities$: Observable<any[]> = this.entitiesSource.asObservable();
  selectedEntity$: Observable<any> = this.selectedEntitySource.asObservable();

  get selectedEntityValue(): any {
    return this.selectedEntitySource.value;
  }

  get entitiesValue(): any[] {
    return this.entitiesSource.value;
  }

  setSelectedEntity(entity: any): void {
    this.selectedEntitySource.next(entity);
  }

  /** Idempotent per organization: repeated calls reuse the already-loaded list instead of refetching. */
  loadEntitiesForOrganization(organizationId: any): Observable<any[]> {
    if (this.entitiesLoadedForOrg === organizationId) {
      return of(this.entitiesSource.value);
    }
    this.entitiesLoadedForOrg = organizationId;
    return this.GetClientEntitiesLocations(organizationId).pipe(
      tap((entities: any) => {
        const list = entities || [];
        this.entitiesSource.next(list);
        if (list.length && !this.selectedEntitySource.value) {
          this.selectedEntitySource.next(list[0]);
        }
      })
    );
  }

  private BASEURL: any = '';
  public error: any;
  friends: Array<any> = [];
  public headers: Array<any> = [];
  private clearFormEvent: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  constructor(public http: HttpClient, private config: AppConfig) {
    this.BASEURL = this.config.ServiceUrl;
    this.http = http;
    this.headers = [];
    this.headers.push('Content-Type', 'application/json');
    var currnetu: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currnetu);

    if (currentUser && currentUser.access_token) {
      this.headers.push('Authorization', 'Bearer ' + currentUser.token);
    }
  }

  getAuthHeaders() {
    var currentU: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currentU);
    if (currentUser && currentUser.access_token) {
      return {
        headers: { Authorization: 'Bearer ' + currentUser.access_token },
      };
    }
    return { headers: { Authorization: 'Bearer ' } };
  }

  getAuthHeadersJSON() {
    var currentU: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currentU);
    if (currentUser && currentUser.access_token) {
      return {
        headers: {
          Authorization: 'Bearer ' + currentUser.access_token,
          'Content-Type': 'application/json',
        },
      };
    }
    return {
      headers: { Authorization: 'Bearer ', 'Content-Type': 'application/json' },
    };
  }

  getImageAuthHeadersJSON() {
    return { headers: undefined };
  }

  getHeadersJSON() {
    return { headers: { 'Content-Type': 'application/json' } };
  }
  GetEntitiesLocations(organizationId: any) {
    return this.http.get<Array<EntitiesCityCoordinate>>(
      this.BASEURL + '/Entity/GetEntitiesLocations/' + organizationId,
      this.getAuthHeadersJSON()
    );
  }
  GetClientEntitiesLocations(organizationId: any) {
    return this.http.get<Array<EntitiesCityCoordinate>>(
      this.BASEURL + '/UserEntity/GetEntitiesByOrganization/' + organizationId,
      this.getAuthHeadersJSON()
    );
  }
  GetEntitiesLocationByUserId() {
    return this.http.get<clientEntitesLocation[]>(
      this.BASEURL + '/Location/GetClientEntitiesLocations/',
      this.getAuthHeadersJSON()
    );
  }
  GetAllCountryCoordinates() {
    return this.http.get(
      this.BASEURL + '/Country/GetAllCountriesFromJsonFile/',
      this.getAuthHeadersJSON()
    );
  }
}
