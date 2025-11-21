import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegulationApprovalComponent } from './regulation-approval.component';

describe('RegulationApprovalComponent', () => {
  let component: RegulationApprovalComponent;
  let fixture: ComponentFixture<RegulationApprovalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegulationApprovalComponent]
    });
    fixture = TestBed.createComponent(RegulationApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
