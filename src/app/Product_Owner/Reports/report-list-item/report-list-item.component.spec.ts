import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportListItemComponent } from './report-list-item.component';

describe('ReportListItemComponent', () => {
  let component: ReportListItemComponent;
  let fixture: ComponentFixture<ReportListItemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReportListItemComponent]
    });
    fixture = TestBed.createComponent(ReportListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
