import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateRolesComponent } from './update-roles.component';

describe('UpdateRolesComponent', () => {
  let component: UpdateRolesComponent;
  let fixture: ComponentFixture<UpdateRolesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateRolesComponent]
    });
    fixture = TestBed.createComponent(UpdateRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
