import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationEntityComponent } from './organization-entity.component';

describe('OrganizationEntityComponent', () => {
  let component: OrganizationEntityComponent;
  let fixture: ComponentFixture<OrganizationEntityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrganizationEntityComponent]
    });
    fixture = TestBed.createComponent(OrganizationEntityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
