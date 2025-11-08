import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegulationGroupingComponent } from './regulation-grouping.component';

describe('RegulationGroupingComponent', () => {
  let component: RegulationGroupingComponent;
  let fixture: ComponentFixture<RegulationGroupingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegulationGroupingComponent]
    });
    fixture = TestBed.createComponent(RegulationGroupingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
