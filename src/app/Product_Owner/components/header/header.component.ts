import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CompliancetrackerService } from 'src/app/Services/compliancetracker.service';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { UserEntityService } from 'src/app/Services/userentity.service';
import { ComplianceTrackerListComponent } from '../../client/compliance-tracker/compliance-tracker-list/compliance-tracker-list.component';
import { RegulationSetupService } from 'src/app/Services/regulationsetup.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CountryService } from 'src/app/Services/country.service';
import { NotificationService } from 'src/app/Services/notification.service';
import {
  AppNotification,
  NotificationResponse,
  TextConstants,
} from 'src/app/Models/notificationModel';
import { format, isToday, isYesterday } from 'date-fns';
import { Router } from '@angular/router';
import { ModuleType } from 'src/app/enums/enums';
import { ApprovalCountrystateComponent } from '../../product-setup/country-setup/approval-countrystate/approval-countrystate.component';
import { OrganizationVerticalnavComponent } from '../../organization-setup/organization-verticalnav/organization-verticalnav.component';
import { ca } from 'date-fns/locale';
import { ApprovalCountrymajorIndustryComponent } from '../../product-setup/industry-setup/approval-countrymajor-industry/approval-countrymajor-industry.component';
import { UserApprovalComponent } from '../../user_management/user-approval/user-approval.component';
import { RoleApprovalComponent } from '../../user_management/userRoles/role-approval/role-approval.component';
import { ApprovalBranchSetupComponent } from '../../product-setup/branch-setup/approval-branch-setup/approval-branch-setup.component';
import { ApproveEntityTypeComponent } from '../../product-setup/entity-type-setup/approve-entity-type/approve-entity-type.component';
import { ParameterApprovalComponent } from '../../product-setup/parameter-setup/parameter-approval/parameter-approval.component';
import { ApproveRegulationComponent } from '../../product-setup/regulation-grouping-setup/approve-regulation/approve-regulation.component';
import { RegulationApprovalComponent } from '../../product-setup/regulation-setup/regulation-approval/regulation-approval.component';
import { OrganizationApprovalComponent } from '../../organization-setup/organization-approval/organization-approval.component';
import { DmsNotificationService } from 'src/app/Services/dms-notification.service';
import { DmsNotificationResponse } from 'src/app/Models/dmsNotification.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  name: string = '';
  entityList: any[] = [];
  selectedHeaderEntity: any = null;

  private readonly allNavItems = [
    { title: 'CompSeqr', route: '/compseqr', icon: 'bi-shield-check' },
    { title: 'ProEDox', route: '/home', icon: 'bi-folder2-open' },
    { title: 'User Management', route: '/users', icon: 'bi-people' },
  ];

  /** DMS-only logins (persistance.isDmsUser()) never see CompSeqr — that data belongs to COMPSEQR360 users. */
  get navItems() {
    return this.persistance.isDmsUser()
      ? this.allNavItems.filter(item => item.title !== 'CompSeqr')
      : this.allNavItems;
  }
  @ViewChild(OrganizationVerticalnavComponent)
  orgVerticalNav!: OrganizationVerticalnavComponent;
  @ViewChild(ComplianceTrackerListComponent)
  childComponent!: ComplianceTrackerListComponent;
  @ViewChild('NotificationViewTemplate')
  notificationViewTemplate!: TemplateRef<any>;
  @ViewChild('allNotificationsModal', { static: true })
  allNotificationsModal!: TemplateRef<any>;
  financialStart: Number | undefined;
  financialEnd: number | undefined;
  fromMonth: string | undefined;
  toMonth: string | undefined;
  currentYear: Number | undefined;
  listYear: any[] = [];
  notificationResponse: NotificationResponse | null = null;
  notifications: AppNotification[] = [];
  unreadCount: number = 0;
  showNotificationPopup: boolean = false;
  allNotifications: AppNotification[] = [];
  private modalRef?: NgbModalRef;

  // DMS notifications (uploads under Compliance Tracker / Notices / Opinions /
  // Audits, plus DMS file/folder shares). This is the only feed the header
  // bell shows — the admin approval-notifications fields above (notifications/
  // unreadCount/etc.) are kept for their own modal but aren't wired into the
  // bell/popup.
  dmsNotifications: DmsNotificationResponse[] = [];
  dmsUnreadCount: number = 0;
  isLoadingDmsNotifications: boolean = false;
  isMarkingAllDmsRead: boolean = false;

  constructor(
    private persistance: PersistenceService,
    public complianceTrackerService: CompliancetrackerService,
    public regulationSetupService: RegulationSetupService,
    public countryService: CountryService,
    public notificationService: NotificationService,
    public dmsNotificationService: DmsNotificationService,
    private modalService: NgbModal,
    private router: Router,
    private eRef: ElementRef,
    private userEntityService: UserEntityService
  ) {
    this.name = this.persistance.getUserName();
    localStorage.removeItem('EntityName');
    localStorage.removeItem('EntityId');
  }

  ngOnInit() {
    // this.getEntities();
    // this.fetchNotificationData();
    this.loadHeaderEntities();
    this.loadDmsUnreadCount();
  }

  isNavActive(item: { title: string; route: string }): boolean {
    const currentUrl = this.router.url;
    if (item.title === 'User Management') {
      return currentUrl.includes('/users') || currentUrl.includes('/roles');
    }
    return currentUrl === item.route || currentUrl.startsWith(item.route + '/');
  }

  loadHeaderEntities(): void {
    const organizationId = this.persistance.getOrganizationId();
    if (!organizationId) {
      return;
    }
    this.userEntityService.loadEntitiesForOrganization(organizationId).subscribe();
    this.userEntityService.entities$.subscribe(list => (this.entityList = list));
    this.userEntityService.selectedEntity$.subscribe(entity => (this.selectedHeaderEntity = entity));
  }

  onHeaderEntityChange(entity: any): void {
    this.userEntityService.setSelectedEntity(entity);
  }

  compareHeaderEntities(a: any, b: any): boolean {
    return a && b ? a.id === b.id : a === b;
  }

  logout(event: Event) {
    event.preventDefault();
    this.persistance.logout();
  }

  getEntities() {
    this.complianceTrackerService.getEntities().subscribe({
      next: (result: any) => {
        console.log(result);
        this.entityList = result;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  updateChildDropdownOptions(selectedValue: string) {
    let options: any[] = [];
    this.currentYear = new Date().getFullYear();
    this.complianceTrackerService.getEntityById(selectedValue).subscribe({
      next: (result: any) => {
        if (
          result.financialYearStart != undefined &&
          result.financialYearEnd != undefined
        ) {
          this.financialStart = result.financialYearStart;
          this.financialEnd = result.financialYearEnd;
          this.fromMonth = result.fromMonth;
          this.toMonth = result.toMonth;
          var finStYr = this.financialStart;
          var finEdYr = this.financialEnd;
          var count = Number(this.currentYear) - Number(finStYr);
          for (let i = 0; i < count; i++) {
            this.listYear.push({
              month: this.fromMonth + '-' + this.toMonth,
              year: finStYr + '-' + finEdYr,
            });
            finStYr = Number(finStYr) + 1;
            finEdYr = Number(finEdYr) + 1;
          }
          if (this.financialStart == this.financialEnd) {
            this.listYear.push({
              month: this.fromMonth + '-' + this.toMonth,
              year: new Date().getFullYear() + '-' + new Date().getFullYear(),
            });
          } else {
            // console.log('next year', Number(new Date().getFullYear() + 1))
            this.listYear.push({
              month: this.fromMonth + '-' + this.toMonth,
              year:
                new Date().getFullYear() +
                '-' +
                Number(new Date().getFullYear() + 1),
            });
          }
        }
        options = this.listYear;
        this.complianceTrackerService.setChildOptions(options);
      },
      error: (error: any) => {
        console.log(error);
      },
    });

    this.complianceTrackerService
      .getAllRegulationComplianceDetails(selectedValue)
      .subscribe({
        next: (result: any) => {
          this.complianceTrackerService.LoadGridDetails(result);
        },
        error: (error: any) => {
          console.log(error);
        },
      });
  }
  selectedParentOption: string = '';

  onEntityChange(event: any) {
    console.log('Event:', event);
    const selectedValue = event.target.value;
    if (selectedValue != undefined) {
      var value = selectedValue.split(':')[1];
      console.log('Selected Value:', value);
      localStorage.setItem('EntityName', event.target.selectedOptions[0].text);
      localStorage.setItem('EntityId', event.target.selectedIndex);
      // this.resetFormSubject.next(true);
      // this.complist.getEntityById(event.target.selectedIndex);
      // this.childComponent.getEntityById(event.target.selectedIndex);
      // this.child.getEntityById(event.target.selectedIndex);
      this.selectedParentOption = selectedValue;
      this.updateChildDropdownOptions(value);
      if (this.childComponent) {
        this.childComponent.getEntityById(value);
      } else {
        console.error('Child component not found');
      }
    }
  }

  openMyModal(template: TemplateRef<any>) {
    this.modalService.open(template);
  }

  toggleNotificationPopup() {
    this.showNotificationPopup = !this.showNotificationPopup;
    if (this.showNotificationPopup) {
      this.loadDmsNotifications();
      this.loadDmsUnreadCount();
    }
  }

  async fetchNotificationData() {
    try {
      const userInfo = sessionStorage.getItem('currentUser');
      if (!userInfo) return;
      const user = JSON.parse(userInfo);
      const userId = user?.id || this.persistance.getUserId();
      if (!userId) return;
      const data = await this.notificationService
        .getApprovalNotifications(userId)
        .toPromise();

      this.notificationResponse = data ?? null;

      this.notifications = this.notificationResponse?.notifications || [];
      this.unreadCount = this.notificationResponse?.unreadCount || 0;
      console.log('Fetched notifications:', this.notifications);
      console.log('Unread notifications count:', this.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }
  closeNotificationPopup() {
    this.showNotificationPopup = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;

    const isInsideThisModal = this.eRef.nativeElement.contains(clickedElement);
    const isInsideAnyModal = clickedElement.closest('.modal-content');

    if (this.showNotificationPopup && !isInsideThisModal && !isInsideAnyModal) {
      this.closeNotificationPopup();
    }
  }

  formatNotificationDate(dateString: string): string {
    const utcDate = new Date(dateString);
    const localDate = new Date(
      utcDate.getTime() + utcDate.getTimezoneOffset() * 60000 * -1
    );
    const time = format(localDate, 'hh:mm a');

    if (isToday(localDate)) return `${time}, Today`;
    if (isYesterday(localDate)) return `${time}, Yesterday`;

    const fullDateTime = format(localDate, 'hh:mm a, dd MMM yyyy');
    return fullDateTime;
  }

  navigateToApproval(notification: AppNotification) {
    switch (notification.moduleType) {
      case ModuleType.Country:
      case ModuleType.State:
      case ModuleType.StateMapping:
        this.router.navigate(['/product-setup/country']);
        const modalRef = this.modalService.open(ApprovalCountrystateComponent, {
          size: 'xl',
          centered: true,
        });
        if (notification.moduleType !== ModuleType.StateMapping) {
          modalRef.componentInstance.active = 2;
        }
        break;
      case ModuleType.Organization:
      case ModuleType.Entity:
        this.router.navigate(['/organization-setup/organization']);
        this.modalService.open(OrganizationApprovalComponent, {
          size: 'xl',
          centered: true,
        });
        break;
      case ModuleType.IndustryMapping:
      case ModuleType.MajorIndustry:
      case ModuleType.MinorIndustry:
        this.router.navigate(['/product-setup/industry']);
        const indModelRef = this.modalService.open(
          ApprovalCountrymajorIndustryComponent,
          {
            size: 'xl',
            centered: true,
          }
        );
        if (notification.moduleType !== ModuleType.IndustryMapping) {
          indModelRef.componentInstance.active = 2;
        }
        break;
      case ModuleType.TypeOfBranch:
      case ModuleType.TypeOfBranchMapping:
        this.router.navigate(['/product-setup/branchsetup']);
        const TypeOfBranchModel = this.modalService.open(
          ApprovalBranchSetupComponent,
          {
            size: 'xl',
            centered: true,
          }
        );
        if (notification.moduleType !== ModuleType.TypeOfBranchMapping) {
          TypeOfBranchModel.componentInstance.active = 2;
        }
        break;
      case ModuleType.EntityType:
      case ModuleType.EntityTypeMapping:
        this.router.navigate(['/product-setup/entity-type']);
        var entModelRef = this.modalService.open(ApproveEntityTypeComponent, {
          size: 'xl',
          centered: true,
        });
        if (notification.moduleType !== ModuleType.EntityTypeMapping) {
          entModelRef.componentInstance.active = 2;
        }
        break;
      case ModuleType.Parameter:
        this.router.navigate(['/product-setup/parameter']);
        this.modalService.open(ParameterApprovalComponent, {
          size: 'xl',
          centered: true,
        });
        break;
      case ModuleType.RegulationGroup:
      case ModuleType.RegulationGroupMapping:
        this.router.navigate(['/product-owner/regulation']);
        var regModelRef = this.modalService.open(ApproveRegulationComponent, {
          size: 'xl',
          centered: true,
        });
        if (notification.moduleType !== ModuleType.RegulationGroupMapping) {
          regModelRef.componentInstance.active = 2;
        }
        break;
      case ModuleType.RegulationSetup:
        this.router.navigate(['/product-setup/regulationsetup']);
        this.modalService.open(RegulationApprovalComponent, {
          size: 'xl',
          centered: true,
        });
        break;
      case ModuleType.User:
        this.router.navigate(['/users']);
        this.modalService.open(UserApprovalComponent, {
          size: 'xl',
          centered: true,
        });
        break;
      case ModuleType.Role:
        this.router.navigate(['/roles']);
        this.modalService.open(RoleApprovalComponent, {
          size: 'xl',
          centered: true,
        });
        break;
      default:
        break;
    }
  }

  markAsRead(notificationId: string | undefined) {
    if (!notificationId) {
      return;
    }

    const userInfo = sessionStorage.getItem('currentUser');
    if (!userInfo) {
      return;
    }

    const user = JSON.parse(userInfo);
    const userUID = user?.uid;
    if (!userUID) {
      return;
    }

    const notification = this.notifications.find(
      (x) => x.notificationId === notificationId
    );
    if (!notification || notification.markAsRead) {
      return;
    }

    this.notificationService
      .markNotificationAsRead(userUID, notificationId, true)
      .subscribe({
        next: () => {
          this.fetchNotificationData();
        },
        error: (err: any) => {
          console.error('Failed to mark notification as read', err);
        },
      });
  }

  onNotificationClick(notification: AppNotification) {
    if (!notification.markAsRead) {
      this.markAsRead(notification.notificationId);
    }

    this.navigateToApproval(notification);
  }

  openAllNotifications() {
    this.toggleNotificationPopup();
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    sixDaysAgo.setHours(0, 0, 0, 0);

    this.allNotifications = this.notifications.filter((n) => {
      const date = new Date(n.createdDate);
      return (
        !isNaN(date.getTime()) &&
        date.getFullYear() >= sixDaysAgo.getFullYear() &&
        date.getMonth() >= sixDaysAgo.getMonth() &&
        date.getDate() >= sixDaysAgo.getDate()
      );
    });
    this.modalRef = this.modalService.open(this.allNotificationsModal, {
      size: 'lg',
      centered: true,
    });
  }

  // ---------------------------------------------------------------------
  // DMS notifications (api/DmsNotification) — upload notifications under
  // Compliance Tracker / Notices / Opinions / Audits, and DMS file/folder
  // share notifications. No polling: the badge is refreshed on page load,
  // whenever the panel opens, and locally after mark-read/mark-all-read.
  // ---------------------------------------------------------------------

  loadDmsUnreadCount(): void {
    const userId = this.persistance.getUserId();
    if (!userId) {
      return;
    }
    this.dmsNotificationService.unreadCount(userId, this.persistance.getUserType()).subscribe({
      next: (result) => {
        this.dmsUnreadCount = result?.unreadCount || 0;
      },
      error: (err: any) => {
        console.error('Failed to load DMS notification unread count', err);
      },
    });
  }

  loadDmsNotifications(): void {
    const userId = this.persistance.getUserId();
    if (!userId) {
      return;
    }
    this.isLoadingDmsNotifications = true;
    this.dmsNotificationService.list(userId, false, this.persistance.getUserType()).subscribe({
      next: (result) => {
        this.dmsNotifications = result || [];
        this.isLoadingDmsNotifications = false;
      },
      error: (err: any) => {
        console.error('Failed to load DMS notifications', err);
        this.dmsNotifications = [];
        this.isLoadingDmsNotifications = false;
      },
    });
  }

  dmsNotificationVerb(notification: DmsNotificationResponse): string {
    return notification.notificationType === 'Share' ? 'shared' : 'uploaded';
  }

  /** Compact relative time, e.g. "2h ago" — matches the popup's list-row format. */
  dmsRelativeTime(iso: string | null): string {
    if (!iso) {
      return '';
    }
    const then = new Date(iso).getTime();
    if (isNaN(then)) {
      return '';
    }
    const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    const diffMon = Math.floor(diffDay / 30);
    if (diffMon < 12) return `${diffMon}mo ago`;
    return `${Math.floor(diffMon / 12)}y ago`;
  }

  /** Marks a DMS notification read (local unread-count update, no re-fetch) — shared by row-click and the View action. */
  private markDmsNotificationReadLocally(notification: DmsNotificationResponse): void {
    if (notification.isRead) {
      return;
    }
    const userId = this.persistance.getUserId();
    if (!userId) {
      return;
    }
    this.dmsNotificationService.markRead(notification.id, userId, this.persistance.getUserType()).subscribe({
      next: (result) => {
        if (result?.success !== false) {
          notification.isRead = true;
          this.dmsUnreadCount = Math.max(0, this.dmsUnreadCount - 1);
        }
      },
      error: (err: any) => {
        console.error('Failed to mark DMS notification as read', err);
      },
    });
  }

  /**
   * "View" on a Share notification — same effect as clicking the row itself
   * (navigate to where the file lives and show it in the file list there).
   * A separate button mainly so it reads as an obvious call to action; kept
   * as its own handler (rather than removing it) so it can stopPropagation
   * cleanly instead of double-firing the row's own click.
   */
  viewSharedNotificationFile(notification: DmsNotificationResponse, event: Event): void {
    event.stopPropagation();
    this.onDmsNotificationClick(notification);
  }

  onDmsNotificationClick(notification: DmsNotificationResponse): void {
    this.markDmsNotificationReadLocally(notification);
    this.closeNotificationPopup();
    this.navigateForDmsNotification(notification);
  }

  markAllDmsNotificationsRead(event: Event): void {
    event.stopPropagation();
    const userId = this.persistance.getUserId();
    if (!userId || this.dmsUnreadCount === 0) {
      return;
    }
    this.isMarkingAllDmsRead = true;
    this.dmsNotificationService.markAllRead(userId, this.persistance.getUserType()).subscribe({
      next: () => {
        this.dmsNotifications = this.dmsNotifications.map((n) => ({ ...n, isRead: true, readOn: n.readOn ?? new Date().toISOString() }));
        this.dmsUnreadCount = 0;
        this.isMarkingAllDmsRead = false;
      },
      error: (err: any) => {
        console.error('Failed to mark all DMS notifications as read', err);
        this.isMarkingAllDmsRead = false;
      },
    });
  }

  /**
   * No routed URL identifies a single record (/compseqr and /home only ever
   * open at their entity root and build the tree client-side), so the actual
   * record is located client-side instead: switch to the right entity, hand
   * the target off via UserEntityService.setPendingDeepLink(), and land on
   * the module's tab. FileuploadnewComponent picks the pending target up
   * once its tree has loaded and opens the matching node — see
   * resolvePendingDeepLink() there.
   */
  private navigateForDmsNotification(notification: DmsNotificationResponse): void {
    const isDmsSide = notification.sourceModule === 'DMSFile' || notification.sourceModule === 'DMSFolder';
    const targetRoute = isDmsSide ? '/home' : '/compseqr';

    if (notification.entityId != null) {
      const entity = this.userEntityService.entitiesValue.find((e: any) => e.id === notification.entityId);
      if (entity) {
        this.userEntityService.setSelectedEntity(entity);
      }
    }

    this.userEntityService.setPendingDeepLink({
      sourceModule: notification.sourceModule,
      sourceRecordId: notification.sourceRecordId,
      entityId: notification.entityId,
      path: notification.path,
      fileName: notification.fileName,
      filePath: notification.filePath,
      actionByName: notification.actionByName,
      createdOn: notification.createdOn
    });

    this.router.navigate([targetRoute]);
  }
}
