import { Component, ViewChild } from '@angular/core';
import { MapInfoWindow } from '@angular/google-maps';
import { clientEntitesLocation} from 'src/app/Models/userEntityModel';
import { UserEntityService } from 'src/app/Services/userentity.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { NotifierService } from 'angular-notifier';
import { OrganizationService } from 'src/app/Services/organization.service';
import { CountryService } from 'src/app/Services/country.service';
import { EntityService } from 'src/app/Services/entity.service';
import { ServiceRequestService } from 'src/app/Services/service-request.service';
import { BillingDetailsService } from 'src/app/Services/billing-details.service';
import { ServiceAndBillingDetails } from 'src/app/Models/countryModel';
import { set } from 'date-fns';
import { th } from 'date-fns/locale';
import { MenuOptionModel } from 'src/app/Models/Users';

interface MapMarker extends google.maps.LatLngLiteral {
  icon: google.maps.Icon;
  status?: number;
}

interface IkeyValue {
  key: number | string;
  value: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  countries: any[] = [];
  markerStatusCount = {} as ServiceAndBillingDetails;
  selectedCountry: string = 'All'; // Default selection
  selectedCountryInList: string = 'All'; // Default selection
  organizations: any[] = [];
  entities: any[] = [];
  entitiesDataForServiceAndBilling: any[] = [];
  serviceRequests: any[] = [];
  billingDetails: any[] = [];
  showNoAccess: boolean = false;
  showMapViewButton: boolean = false;
  showListViewButton: boolean = false;
  selectedStatus: number = -1;
  statusToggle: boolean = false;
  get selectedOrgs() {
    return this.organizations.filter(org => this.selectedCategory === '1' || org.entities?.some((entity: any) => entity[this.categoryType[Number(this.selectedCategory) - 2]]));
  }
  get selectedEntities() {
    return this.entities.filter(entity => this.selectedCategory === '1' || entity[this.categoryType[Number(this.selectedCategory) - 2]]);
  }
  get selectedServiceRequests() {
    return this.serviceRequests || [];
  }
  selectCountry(country: string) {
    this.selectedCountry = country;
  }

  active = 1;
  menuPosition = { x: 0, y: 0 };
  selectedCategory: string = '1';
  expandedProduct: any = null;
  entitiesData: clientEntitesLocation[] = [];
  countryCoordinates: any[] = [];
  categoryType: any[] = ['hasServiceRequests', 'hasBillingDetails'];
  selectedState: string = '';
  stateErrorMsg: string = '';
  selectedMarkerInfo: {
    stateName: string;
    countryName?: string;
    latitude: number;
    longitude: number;
  } | null = null;
  @ViewChild('infoWindow') infoWindow!: MapInfoWindow;

  private previousState: string = '';

  isMapView: boolean = true;
  //map view
  switchToMapView() {
    this.isMapView = true;
  }

  //list view
  switchToListView() {
    this.isMapView = false;
  }

  expandedEntities: { [key: string]: boolean } = {};
  toggleEntity(productName: string, entityName: string) {
    const key = `${productName}_${entityName}`;
    this.expandedEntities[key] = !this.expandedEntities[key];
  }
  toggleProduct(product: any): void {
    if (this.expandedProduct === product) {
      this.expandedProduct = null;
    } else {
      this.expandedProduct = product;
    }
  }

  isProductExpanded(product: any): boolean {
    return this.expandedProduct === product;
  }

  isEntityExpanded(productName: string, entityName: string): boolean {
    return this.expandedEntities[`${productName}_${entityName}`] || false;
  }



  zoom = 0;
  center: google.maps.LatLngLiteral = { lat: 0, lng: 0 }; // Center of India
  markerPosition: google.maps.LatLngLiteral = this.center;
  markers: MapMarker[] = [];
  visibleMarkers: MapMarker[] = [];
  visibleMarkersBuffer: MapMarker[] = [];
  popupPosition: { x: number; y: number } = { x: 0, y: 0 }; // Add this line

  onMarkerClick(marker: any, markerRef: any) {
    const entity = this.entitiesData.find(
      (loc) => loc.latitude === marker.lat && loc.longitude === marker.lng
    );
    if (entity) {
      if (entity.stateId) {
        setTimeout(() => {
          this.getCountryOrStateStatusCount(marker.stateId, marker.countryId);
        }, 0);
      }
      this.selectedMarkerInfo = {
        stateName: entity.stateName || 'Unknown',
        countryName: entity.countryName || 'Unknown',
        latitude: entity.latitude,
        longitude: entity.longitude,
      };
    } else {
      setTimeout(() => {
        this.getCountryOrStateStatusCount(0, marker.countryId, true);
      }, 0);
      this.selectedMarkerInfo = {
        stateName: marker.name,
        countryName: marker.name || 'Unknown',
        latitude: marker.lat,
        longitude: marker.lng,
      };
    }
    this.infoWindow.open(markerRef);
  }
  @ViewChild('map', { static: false }) map: any;

  countryList: IkeyValue[] = [];
  stateList: IkeyValue[] = [];
  readonly mapStyles = [
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#999999' }],
    },
    {
      featureType: 'administrative.country',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#ffffff' }, { weight: 1.5 }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'water',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'road',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'administrative',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'administrative.locality',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'administrative.neighborhood',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'administrative.province',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'administrative',
      elementType: 'geometry',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      featureType: 'administrative.country',
      elementType: 'geometry.stroke',
      stylers: [
        {
          visibility: 'on',
        },
      ],
    },
    {
      featureType: 'administrative.province',
      elementType: 'geometry.stroke',
      stylers: [
        {
          visibility: 'on',
        },
      ],
    },
    {
      featureType: 'administrative.locality',
      elementType: 'geometry.stroke',
      stylers: [
        {
          visibility: 'on',
        },
      ],
    },
    {
      featureType: 'administrative.neighborhood',
      elementType: 'geometry.stroke',
      stylers: [
        {
          visibility: 'on',
        },
      ],
    },
    {
      featureType: 'administrative.land_parcel',
      elementType: 'geometry.stroke',
      stylers: [
        {
          visibility: 'on',
        },
      ],
    },
  ];

  viewCountryDetails = () => {
    if (this.selectedMarkerInfo && this.selectedMarkerInfo.stateName) {
      this.switchToListView();
      const country = this.countryList.find(
        c => c.value === this.selectedMarkerInfo?.countryName
      );
      if (country) {
        this.selectedCountryInList = country.key as string;
        this.selectedCountryData({ countryName: country.value, id: country.key });
      }
    }
  };

  //get country or state status count
  getCountryOrStateStatusCount = (stateId: number, countryId: string, isCountry: boolean = false) => {
    isCountry ? this.countryService.getServiceReAndBillingDetailsByCountryId(countryId, this.persistance.getUserId()!).subscribe({
      next: (data) => {
        this.markerStatusCount = data;
      },
      error: (error) => {
        console.error('Error fetching service request and billing details:', error);
      }
    }) : this.countryService.getServiceReAndBillingDetailsByStateId(stateId, this.persistance.getUserId()!).subscribe({
      next: (data) => {
        this.markerStatusCount = data;
      },
      error: (error) => {
        console.error('Error fetching service request and billing details:', error);
      }
    });
  };

  mapOptions: google.maps.MapOptions = {
    center: { lat: 20, lng: 0 },
    zoom: 0,
    minZoom: 0,
    maxZoom: 5,
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.BOTTOM_RIGHT,
    },

    gestureHandling: 'greedy',
    mapTypeId: 'roadmap',

    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    scaleControl: false,
    rotateControl: false,

    restriction: {
      latLngBounds: {
        north: 85,
        south: -85,
        west: -180,
        east: 180,
    },
    strictBounds: true,
  },


    styles: this.mapStyles,
  };

  constructor(
    private entityService: UserEntityService,
    private persistance: PersistenceService,
    private notifier: NotifierService,
    private organizationService: OrganizationService,
    public countryService: CountryService,
    private entityServiceById: EntityService,
    private serviceRequest: ServiceRequestService,
    private billingDetailsByEntity: BillingDetailsService

  ) { }

  updateVisibleMarkers = () => {
    const mapInstance = this.map.googleMap!;
    const bounds = mapInstance.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // Clamp the bounds to the restriction range
    const maxLat = 85;
    const minLat = -85;
    const maxLng = 179;
    const minLng = -179;

    const filtered = this.markers.filter((m) => {
      const lat = Math.max(Math.min(m.lat, maxLat), minLat);
      const lng = Math.max(Math.min(m.lng, maxLng), minLng);
      return (
        lat <= Math.min(ne.lat(), maxLat) &&
        lat >= Math.max(sw.lat(), minLat) &&
        lng <= Math.min(ne.lng(), maxLng) &&
        lng >= Math.max(sw.lng(), minLng)
      );
    });

    if (mapInstance.getZoom() <= 3) {

      // Show only one marker (first visible) when zoomed out
      this.visibleMarkers =
        filtered.length > 0 ? this.visibleMarkersBuffer : [];
    } else {
      // Show all visible markers when zoomed in
      this.markers.forEach(m => {
        const status = this.getDataWithStatus(m, this.entitiesData, true);
        m.status = status;
        m.icon = this.getIcon(status);
      });
      this.visibleMarkers =
        filtered.length > 0 ? filtered : this.visibleMarkersBuffer;
    }
  };

  onMapChanged() {
    this.updateVisibleMarkers();
  }

  onRightClick(event: MouseEvent, country: string): void {
    event.preventDefault(); // Prevent default context menu
    this.selectedCountry = country;
    this.menuPosition = { x: event.clientX, y: event.clientY };
  }

  onchangeCountry(value: string) {
    this.selectedCountry = value;
    let filteredEntities = this.setStateAndFilterEntities(value);
    if (!this.isMapView) {
      const country = this.countryList.find(
        (c) => c.key === value
      );
      country && this.selectedCountryData({ countryName: country.value, id: country.key });
    }

    this.getVisibleMarkers(filteredEntities);
    this.updateVisibleMarkers();
  }

  setStateAndFilterEntities(value: string) {
    let filteredEntities;
    if (value === 'All') {
      filteredEntities = this.entitiesData;
      // Show all states if country is not selected
      this.stateList = Array.from(
        new Map(
          this.entitiesData
            .filter(
              (loc) => loc.stateId !== undefined && loc.stateName !== undefined
            )
            .map((loc) => [
              loc.stateId,
              { key: loc.stateId as number, value: loc.stateName },
            ])
        ).values()
      );
    } else {
      filteredEntities = this.entitiesData.filter(
        (loc) => loc.countryId === value
      );
      this.stateList = Array.from(
        new Map(
          this.entitiesData
            .filter(
              (loc) =>
                loc.countryId === value &&
                loc.stateId !== undefined &&
                loc.stateName !== undefined
            )
            .map((loc) => [
              loc.stateId,
              { key: loc.stateId as number, value: loc.stateName },
            ])
        ).values()
      );
    }
    this.markers = filteredEntities.map((loc) => ({
      lat: loc.latitude,
      lng: loc.longitude,
      icon: this.getIcon(loc.status),
      status: loc.status,
      stateId: loc.stateId,
      countryId: loc.countryId
    }));
    return filteredEntities;
  }

  onchangeState(value: string) {
    if (!this.selectedCountry || this.selectedCountry === 'All') {
      this.notifier.notify('error', 'Please select the country first');
      setTimeout(() => {
        this.selectedState = '';
      });
      return;
    }
    this.stateErrorMsg = '';
    this.previousState = value;
    this.selectedState = value;
    let filteredEntities;
    if (value === '') {
      filteredEntities = this.entitiesData.filter(
        (loc) => loc.countryId === this.selectedCountry
      );
    } else {
      const stateIdNum = typeof value === 'string' ? Number(value) : value;
      filteredEntities = this.entitiesData.filter(
        (loc) => loc.stateId === stateIdNum
      );
    }
    this.markers = filteredEntities.map((loc) => ({
      lat: loc.latitude,
      lng: loc.longitude,
      icon: this.getIcon(loc.status),
      status: loc.status,
      stateId: loc.stateId,
      countryId: loc.countryId
    }));

    this.getVisibleMarkers(filteredEntities);
    this.updateVisibleMarkers();
  }

  getVisibleMarkers(result: clientEntitesLocation[]) {
    const groupedMarkers: { [country: string]: MapMarker[] } = {};
    result.forEach((loc) => {
      const country = loc.countryName || 'Unknown';
      if (!groupedMarkers[country]) {
        groupedMarkers[country] = [];
      }
      const countryFromJson = this.countryCoordinates.find(
        (c) => c.name === country
      );
      const status = this.getDataWithStatus(loc, result);
      groupedMarkers[country] = [
        {
          lat: countryFromJson?.latitude ?? 0,
          lng: countryFromJson?.longitude ?? 0,
          icon: this.getIcon(status),
          status,
          stateId: loc.stateId,
          countryId: loc.countryId,
          ...countryFromJson,
        },
      ];
    });
    this.visibleMarkers = Object.values(groupedMarkers).map((markers) => {
      const statusCount: { [status: number]: number } = {};
      markers.forEach((m) => {
        let status = 0;
        if (m.icon.url.includes('red')) status = 0;
        else if (m.icon.url.includes('orange')) status = 1;
        else if (m.icon.url.includes('green')) status = 2;
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      const maxStatus = Object.keys(statusCount).reduce((a, b) =>
        statusCount[+a] > statusCount[+b] ? a : b
      );
      return markers.find((m) => {
        let status = 0;
        if (m.icon.url.includes('red')) status = 0;
        else if (m.icon.url.includes('orange')) status = 1;
        else if (m.icon.url.includes('green')) status = 2;
        return status === +maxStatus;
      })!;
    });
    this.visibleMarkersBuffer = JSON.parse(JSON.stringify(this.visibleMarkers));
  }
  getEntitiesLocations() {
    this.entityService
      .GetEntitiesLocationByUserId()
      .subscribe((result: clientEntitesLocation[]) => {
        this.entitiesData = result;
        this.markers = result.map((loc) => ({
          lat: loc.latitude,
          lng: loc.longitude,
          icon: this.getIcon(loc.status),
          status: loc.status,
          stateId: loc.stateId,
          countryId: loc.countryId
        }));
        this.countryList = Array.from(
          new Map(
            result.map((loc) => [
              loc.countryId,
              { key: loc.countryId, value: loc.countryName },
            ])
          ).values()
        );
        this.stateList = Array.from(
          new Map(
            result
              .filter(
                (loc) =>
                  loc.stateId !== undefined &&
                  loc.stateName !== undefined &&
                  (this.selectedCountry === '' ||
                    loc.countryId === this.selectedCountry)
              )
              .map((loc) => [
                loc.stateId,
                { key: loc.stateId as number, value: loc.stateName },
              ])
          ).values()
        );
        this.getVisibleMarkers(result);
      });
  }

  getDataWithStatus(loc: any, result: clientEntitesLocation[], stateCheck = false) {
    const list = stateCheck ? result.filter((l) => l.stateId === loc.stateId) : result.filter((l) => l.countryId === loc.countryId);
    const maxStatusCount = {
      service: {} as { [key: number]: number },
      billing: {} as { [key: number]: number }
    }
    list.forEach((l) => {
      maxStatusCount.service[l.serviceRequestMaxColorCode] = (maxStatusCount.service[l.serviceRequestMaxColorCode] || 0) + 1;
      maxStatusCount.billing[l.billingDetailsMaxColorCode] = (maxStatusCount.billing[l.billingDetailsMaxColorCode] || 0) + 1;
    });

    // Set loc.status to the key with the maximum value among both service and billing
    loc.maxServiceStatusEntry = Object.entries(maxStatusCount.service)
      .reduce((max, curr) => curr[1] > max[1] ? curr : max, ['0', 0]);
    loc.maxBillingStatusEntry = Object.entries(maxStatusCount.billing)
      .reduce((max, curr) => curr[1] > max[1] ? curr : max, ['0', 0]);
    // Compare counts, pick the status with the higher count
    switch (this.selectedCategory) {
      case '1':
        if (loc.maxServiceStatusEntry[1] > loc.maxBillingStatusEntry[1]) {
          loc.status = Number(loc.maxServiceStatusEntry[0]);
        } else if (loc.maxBillingStatusEntry[1] > loc.maxServiceStatusEntry[1]) {
          loc.status = Number(loc.maxBillingStatusEntry[0]);
        }
        else {
          loc.status = 1;
        }
        break;
      case '2':
        loc.status = Number(loc.maxServiceStatusEntry[0]);
        break;
      case '3':
        loc.status = Number(loc.maxBillingStatusEntry[0]);
        break;
      default:
        loc.status = Number(loc.maxServiceStatusEntry[0]);
        break;
    }

    return loc.status;
  }
  getIcon(status: number | undefined): any {
    let icon = 'assets/images/map-icon-red.svg';
    switch (status) {
      case 1:
        icon = 'assets/images/map-icon-orange.svg';
        break;
      case 2:
        icon = 'assets/images/map-icon-red.svg';
        break;
      case 3:
        icon = 'assets/images/map-icon-green.svg';
        break;
    }
    return { url: icon, scaledSize: new google.maps.Size(40, 40) };
  }

  //get all organizations by user id
  getAllOrganizationsByUserId(): void {
    this.organizationService.getOrganizations().subscribe({
      next: (result) => {
        this.organizations = result;
      },
      error: () => {
        this.notifier.notify('error', 'Failed to fetch all organizations');
      }
    });
  }

  selectedCountryData(country: any, fromDropDown = false): void {
    if (!fromDropDown) {
      this.setStateAndFilterEntities(country.id);
    }
    if (country.id === 'All' || country === 'All') {
      this.selectedCountryInList = 'All';
      if (!this.isMapView) {
        this.getAllOrganizationsByUserId();
      }
    } else {
      this.selectedCountryInList = country.id;
      this.getOrganizationsByCountryId(country.id);
    }
  }
  onOrgPanelOpened(org: any, countryId: string): void {
    if (this.selectedCountryInList === 'All') {
      this.getEntitiesByOrganizationId(org.id);
    }
    else {
      this.getEntitiesByOrganizationIdAndCountryId(org.id, countryId);

    }
  }
  //get all countrys by user id
  getAllCountriesByUserId() {
    const userId = this.persistance.getUserId()!;
    this.countryService.getAllCountryMaster(userId).subscribe((result: any) => {
      this.countries = result;
    });
  }
  //get organizations by country Id and user id
  getOrganizationsByCountryId(countryId: string) {
    const userId = this.persistance.getUserId()!;
    this.organizationService.getOrganizationByCountryIdAndUserId(countryId, userId).subscribe({
      next: (result) => {
        this.organizations = result;
      },
      error: () => {
        this.organizations = [];
        this.notifier.notify('error', 'No organizations Available');
      },
    });
  }


  //get entities by organization Id and country id
  getEntitiesByOrganizationIdAndCountryId(organizationId: number, countryId: string): void {
    this.entityServiceById.GetEntitiesByOrganizationIdByCountryId(organizationId, countryId).subscribe({
      next: (result) => {
        this.entities = result;
      },
      error: () => {
        this.entities = [];
        this.notifier.notify('error', 'No entities Available');
      },
    });
  }

  //get entites by ordganization id
  getEntitiesByOrganizationId(organizationId: number): void {
    this.entityServiceById.GetEntitiesByOrganizationId(organizationId).subscribe({
      next: (result) => {
        this.entities = result;
        // this.entitiesDataForServiceAndBilling = result.filter((e: any) => e.hasServiceRequests || e.hasBillingDetails);
      },
      error: () => {
        this.entities = [];
        this.notifier.notify('error', 'No entities Available');
      },
    });
  }
  //get getServiceRequestByEntityId
  getServiceRequestByEntityId(entityId: number) {
    this.serviceRequest.getServiceRequestByEntityId(entityId).subscribe({
      next: (result: any) => {
        this.serviceRequests = result?.length ? result : [];
      },
      error: () => {
        this.serviceRequests = [];
        this.notifier.notify('error', 'No service requests Available');
      }
    });
  }

  //get billingDetailsByEntityId
  getBillingDetailsByEntityId(entityId: number) {
    this.billingDetailsByEntity.GetBillingDetailsByEntityId(entityId).subscribe({
      next: (result: any) => {
        this.billingDetails = result?.length ? result : [];
      },
      error: () => {
        this.billingDetails = [];
        this.notifier.notify('error', 'No billing details Available');
      }
    });
  }

  // Optionally, close the menu when clicking outside
  ngOnInit() {
    this.entityService.GetAllCountryCoordinates().subscribe({
      next: (result: any) => {
        this.countryCoordinates = result;
      },
    });
    this.getEntitiesLocations();
    this.selectedCountryData('All');
    this.getAllOrganizationsByUserId();
    this.getAllCountriesByUserId();
    setTimeout(() => {
      var roleMenuOptions = this.persistance.getSessionStorage('menuOptions');
      if (roleMenuOptions && roleMenuOptions.length > 0) {
        //get menu options for for parentId = 3
        var menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 1);
        console.log('Org setup Menu Options:', menuOptions);
        if (menuOptions.length > 0 || this.persistance.getRoleId() !== 1) {
          this.showMapViewButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Map View' && option.canView).length > 0;
          this.showListViewButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'List View' && option.canView).length > 0;
          if (this.showListViewButton && !this.showMapViewButton) {
            this.switchToListView();
          }
        }
      }
      // After you set showMapViewButton and showListViewButton:
      this.showNoAccess = !this.showMapViewButton && !this.showListViewButton;
    }, 1000);
  }

  //status on change
  onStatusClick(color: number) {
    if (this.selectedStatus === color && this.statusToggle) {
      this.statusToggle = false;
      this.selectedStatus = -1;
    } else {
      this.statusToggle = true;
      this.selectedStatus = color;
    }
    if (this.isMapView) {
      this.getVisibleMarkers(this.entitiesData.filter(m => m.status === this.selectedStatus || this.selectedStatus === -1));
      this.updateVisibleMarkers();
    }
  }

  //category change
  onCategoryChange() {
    // this.entitiesData = this.getDataWithStatus(this.entitiesData);
    this.updateVisibleMarkers();
  }
}
