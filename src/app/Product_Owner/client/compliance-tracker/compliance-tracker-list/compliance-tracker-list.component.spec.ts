import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceTrackerListComponent } from './compliance-tracker-list.component';

describe('ComplianceTrackerListComponent', () => {
  let component: ComplianceTrackerListComponent;
  let fixture: ComponentFixture<ComplianceTrackerListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ComplianceTrackerListComponent]
    });
    fixture = TestBed.createComponent(ComplianceTrackerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
