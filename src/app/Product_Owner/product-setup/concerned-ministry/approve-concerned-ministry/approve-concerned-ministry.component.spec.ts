import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveConcernedMinistryComponent } from './approve-concerned-ministry.component';

describe('ApproveConcernedMinistryComponent', () => {
  let component: ApproveConcernedMinistryComponent;
  let fixture: ComponentFixture<ApproveConcernedMinistryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ApproveConcernedMinistryComponent]
    });
    fixture = TestBed.createComponent(ApproveConcernedMinistryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
