import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalControlComponent } from './approval-control.component';

describe('ApprovalControlComponent', () => {
  let component: ApprovalControlComponent;
  let fixture: ComponentFixture<ApprovalControlComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ApprovalControlComponent]
    });
    fixture = TestBed.createComponent(ApprovalControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
