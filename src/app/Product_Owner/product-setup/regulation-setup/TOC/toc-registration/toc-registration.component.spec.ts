import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TocRegistrationComponent } from './toc-registration.component';

describe('TocRegistrationComponent', () => {
  let component: TocRegistrationComponent;
  let fixture: ComponentFixture<TocRegistrationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TocRegistrationComponent]
    });
    fixture = TestBed.createComponent(TocRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
