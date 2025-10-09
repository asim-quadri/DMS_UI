import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgbuttonComponent } from './agbutton.component';

describe('AgbuttonComponent', () => {
  let component: AgbuttonComponent;
  let fixture: ComponentFixture<AgbuttonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AgbuttonComponent]
    });
    fixture = TestBed.createComponent(AgbuttonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
