import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveRegulationComponent } from './approve-regulation.component';

describe('ApproveRegulationComponent', () => {
  let component: ApproveRegulationComponent;
  let fixture: ComponentFixture<ApproveRegulationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ApproveRegulationComponent]
    });
    fixture = TestBed.createComponent(ApproveRegulationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
