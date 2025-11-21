import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationApprovalComponent } from './organization-approval.component';

describe('OrganizationApprovalComponent', () => {
  let component: OrganizationApprovalComponent;
  let fixture: ComponentFixture<OrganizationApprovalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrganizationApprovalComponent]
    });
    fixture = TestBed.createComponent(OrganizationApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
