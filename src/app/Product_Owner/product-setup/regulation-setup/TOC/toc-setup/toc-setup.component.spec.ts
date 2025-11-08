import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TocSetupComponent } from './toc-setup.component';

describe('TocSetupComponent', () => {
  let component: TocSetupComponent;
  let fixture: ComponentFixture<TocSetupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TocSetupComponent]
    });
    fixture = TestBed.createComponent(TocSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
