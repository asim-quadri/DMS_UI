import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalBranchSetupComponent } from './approval-branch-setup.component';

describe('ApprovalBranchSetupComponent', () => {
  let component: ApprovalBranchSetupComponent;
  let fixture: ComponentFixture<ApprovalBranchSetupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ApprovalBranchSetupComponent]
    });
    fixture = TestBed.createComponent(ApprovalBranchSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
