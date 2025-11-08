import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TocReviewComponent } from './toc-review.component';

describe('TocReviewComponent', () => {
  let component: TocReviewComponent;
  let fixture: ComponentFixture<TocReviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TocReviewComponent]
    });
    fixture = TestBed.createComponent(TocReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
