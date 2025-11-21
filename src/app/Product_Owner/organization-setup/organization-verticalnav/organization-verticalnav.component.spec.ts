import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationVerticalnavComponent } from './organization-verticalnav.component';

describe('OrganizationVerticalnavComponent', () => {
  let component: OrganizationVerticalnavComponent;
  let fixture: ComponentFixture<OrganizationVerticalnavComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrganizationVerticalnavComponent]
    });
    fixture = TestBed.createComponent(OrganizationVerticalnavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
