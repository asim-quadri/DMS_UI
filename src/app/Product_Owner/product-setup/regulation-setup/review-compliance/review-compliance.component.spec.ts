import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewComplianceComponent } from './review-compliance.component';

describe('ReviewComplianceComponent', () => {
  let component: ReviewComplianceComponent;
  let fixture: ComponentFixture<ReviewComplianceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewComplianceComponent]
    });
    fixture = TestBed.createComponent(ReviewComplianceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
