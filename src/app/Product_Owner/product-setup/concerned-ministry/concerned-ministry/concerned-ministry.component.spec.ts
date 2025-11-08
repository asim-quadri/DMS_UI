import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcernedMinistryComponent } from './concerned-ministry.component';

describe('ConcernedMinistryComponent', () => {
  let component: ConcernedMinistryComponent;
  let fixture: ComponentFixture<ConcernedMinistryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConcernedMinistryComponent]
    });
    fixture = TestBed.createComponent(ConcernedMinistryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
