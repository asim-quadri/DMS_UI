import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NotifierService } from 'angular-notifier';
import { forkJoin } from 'rxjs';
import { DmsAccessService } from '../../Services/dms-access.service';
import { DmsUserManagementService } from '../../Services/dms-user-management.service';
import { PersistenceService } from '../../Services/persistence.service';
import { DmsItemType, FileFolderAccessModel, Result } from '../../Models/dmsNotification.model';

/** One item this dialog can grant/revoke access on — used by both single-item and bulk modes. */
export interface DmsShareTarget {
  itemType: DmsItemType;
  itemId: number;
  label: string;
}

@Component({
  selector: 'app-dms-manage-access',
  templateUrl: './dms-manage-access.component.html',
  styleUrls: ['./dms-manage-access.component.scss']
})
export class DmsManageAccessComponent implements OnInit {
  /** Single-item mode. */
  @Input() itemType!: DmsItemType;
  @Input() itemId!: number;
  @Input() itemLabel: string = '';

  /** Bulk mode (checkbox-selected files) — set instead of the three inputs above. */
  @Input() bulkItems: DmsShareTarget[] | null = null;

  accessList: FileFolderAccessModel[] = [];
  isLoadingAccessList = false;
  isSubmitting = false;

  // Typed `any` deliberately — the live API returns camelCase (id/fullName/
  // email), not the PascalCase the DmsUser interface declares (that casing
  // assumption came from client's spec doc and doesn't match this backend).
  // The template reads both casings defensively, matching the pattern
  // users.component.ts's normalizeDmsUser() already uses for the same API.
  recipients: any[] = [];

  grantForm: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private dmsAccessService: DmsAccessService,
    private dmsUserService: DmsUserManagementService,
    private persistence: PersistenceService,
    private notifier: NotifierService,
    private fb: FormBuilder
  ) {
    this.grantForm = this.fb.group({
      dmsUserId: ['', Validators.required],
      canView: [true],
      canEdit: [false],
      canDelete: [false]
    });
  }

  ngOnInit(): void {
    this.loadRecipients();
    if (!this.isBulk) {
      this.loadAccessList();
    }

    // Edit/Delete imply View server-side (per the upsert contract) — mirror
    // that in the form so the checkbox state stays honest before submit.
    this.grantForm.get('canEdit')?.valueChanges.subscribe(v => { if (v) this.grantForm.get('canView')?.setValue(true); });
    this.grantForm.get('canDelete')?.valueChanges.subscribe(v => { if (v) this.grantForm.get('canView')?.setValue(true); });
  }

  get isBulk(): boolean {
    return !!this.bulkItems && this.bulkItems.length > 0;
  }

  get modalTitle(): string {
    if (this.isBulk) {
      const count = this.bulkItems!.length;
      return `Share ${count} item${count === 1 ? '' : 's'}`;
    }
    return 'Manage Access';
  }

  private loadRecipients(): void {
    const userId = this.persistence.getUserId();
    if (!userId) {
      this.recipients = [];
      return;
    }
    this.dmsUserService.getAllDmsUsers(userId).subscribe({
      next: (users) => this.recipients = users || [],
      error: (err) => {
        console.error('Failed to load DMS users', err);
        this.recipients = [];
      }
    });
  }

  loadAccessList(): void {
    if (this.isBulk) {
      return;
    }
    this.isLoadingAccessList = true;
    this.dmsAccessService.getAccessList(this.itemType, this.itemId).subscribe({
      next: (list) => {
        this.accessList = list || [];
        this.isLoadingAccessList = false;
      },
      error: () => {
        this.accessList = [];
        this.isLoadingAccessList = false;
      }
    });
  }

  submitGrant(): void {
    if (this.grantForm.invalid || this.isSubmitting) {
      return;
    }
    const v = this.grantForm.getRawValue();
    const grantedBy = this.persistence.getUserId() ?? null;
    const targets: DmsShareTarget[] = this.isBulk
      ? this.bulkItems!
      : [{ itemType: this.itemType, itemId: this.itemId, label: this.itemLabel }];

    this.isSubmitting = true;
    const requests = targets.map(t => this.dmsAccessService.grantAccess({
      itemType: t.itemType,
      itemId: t.itemId,
      dmsUserId: Number(v.dmsUserId),
      canView: v.canView,
      canEdit: v.canEdit,
      canDelete: v.canDelete,
      grantedBy
    }));

    forkJoin(requests).subscribe({
      next: (results: Result<any>[]) => {
        this.isSubmitting = false;
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
          this.notifier.notify('error', failed[0].message || 'Failed to grant access to some items');
        } else {
          this.notifier.notify('success', targets.length > 1 ? `Shared ${targets.length} item(s)` : (results[0]?.message || 'Access granted'));
        }
        // "if result.message mentions the share notification was not created,
        // surface it as a non-blocking warning toast"
        const warned = results.find(r => r.success && (r.message || '').toLowerCase().includes('notification'));
        if (warned) {
          this.notifier.notify('warning', warned.message);
        }

        this.grantForm.reset({ dmsUserId: '', canView: true, canEdit: false, canDelete: false });
        if (this.isBulk) {
          this.activeModal.close('granted');
        } else {
          this.loadAccessList();
        }
      },
      error: (err) => {
        console.error('Failed to grant access', err);
        this.isSubmitting = false;
        this.notifier.notify('error', 'Failed to grant access');
      }
    });
  }

  revoke(row: FileFolderAccessModel): void {
    if (!window.confirm(`Revoke access for ${row.dmsUserName || 'this user'}?`)) {
      return;
    }
    this.dmsAccessService.revokeAccess({ itemType: row.itemType, itemId: row.itemId, dmsUserId: row.dmsUserId }).subscribe({
      next: (result) => {
        if (result.success) {
          this.notifier.notify('success', result.message || 'Access revoked');
          this.loadAccessList();
        } else {
          this.notifier.notify('error', result.message || 'Failed to revoke access');
        }
      },
      error: (err) => {
        console.error('Failed to revoke access', err);
        this.notifier.notify('error', 'Failed to revoke access');
      }
    });
  }
}
