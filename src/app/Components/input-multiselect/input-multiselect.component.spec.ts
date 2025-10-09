import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputMultiselectComponent } from './input-multiselect.component';

describe('InputMultiselectComponent', () => {
  let component: InputMultiselectComponent;
  let fixture: ComponentFixture<InputMultiselectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InputMultiselectComponent]
    });
    fixture = TestBed.createComponent(InputMultiselectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
