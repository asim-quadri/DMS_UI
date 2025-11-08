import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddConcernedMinistryComponent } from './add-concerned-ministry.component';

describe('AddConcernedMinistryComponent', () => {
  let component: AddConcernedMinistryComponent;
  let fixture: ComponentFixture<AddConcernedMinistryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddConcernedMinistryComponent]
    });
    fixture = TestBed.createComponent(AddConcernedMinistryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
