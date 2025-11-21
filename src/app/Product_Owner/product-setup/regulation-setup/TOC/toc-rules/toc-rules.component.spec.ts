import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TocRulesComponent } from './toc-rules.component';

describe('TocRulesComponent', () => {
  let component: TocRulesComponent;
  let fixture: ComponentFixture<TocRulesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TocRulesComponent]
    });
    fixture = TestBed.createComponent(TocRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
