import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveRegulatoryAuthorityComponent } from './approve-regulatory-authority.component';

describe('ApproveRegulatoryAuthorityComponent', () => {
  let component: ApproveRegulatoryAuthorityComponent;
  let fixture: ComponentFixture<ApproveRegulatoryAuthorityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ApproveRegulatoryAuthorityComponent]
    });
    fixture = TestBed.createComponent(ApproveRegulatoryAuthorityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
