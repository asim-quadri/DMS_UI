import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRegulatoryAuthorityComponent } from './add-regulatory-authority.component';

describe('AddRegulatoryAuthorityComponent', () => {
  let component: AddRegulatoryAuthorityComponent;
  let fixture: ComponentFixture<AddRegulatoryAuthorityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddRegulatoryAuthorityComponent]
    });
    fixture = TestBed.createComponent(AddRegulatoryAuthorityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
