import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewUserComponent } from './review-user.component';

describe('ReviewUserComponent', () => {
  let component: ReviewUserComponent;
  let fixture: ComponentFixture<ReviewUserComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewUserComponent]
    });
    fixture = TestBed.createComponent(ReviewUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
