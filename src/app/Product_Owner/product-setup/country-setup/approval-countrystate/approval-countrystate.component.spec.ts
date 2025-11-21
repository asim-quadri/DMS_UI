import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalCountrystateComponent } from './approval-countrystate.component';

describe('ApprvalCountrystateComponent', () => {
  let component: ApprovalCountrystateComponent;
  let fixture: ComponentFixture<ApprovalCountrystateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ApprovalCountrystateComponent]
    });
    fixture = TestBed.createComponent(ApprovalCountrystateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
