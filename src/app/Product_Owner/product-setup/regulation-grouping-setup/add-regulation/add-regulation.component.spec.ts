import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRegulationComponent } from './add-regulation.component';

describe('AddRegulationComponent', () => {
  let component: AddRegulationComponent;
  let fixture: ComponentFixture<AddRegulationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddRegulationComponent]
    });
    fixture = TestBed.createComponent(AddRegulationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
