import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStateComponent } from './add-state.component';

describe('AddStateComponent', () => {
  let component: AddStateComponent;
  let fixture: ComponentFixture<AddStateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddStateComponent]
    });
    fixture = TestBed.createComponent(AddStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
