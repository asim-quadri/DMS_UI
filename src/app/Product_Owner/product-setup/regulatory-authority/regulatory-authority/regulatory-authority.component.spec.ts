import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegulatoryAuthorityComponent } from './regulatory-authority.component';

describe('RegulatoryAuthorityComponent', () => {
  let component: RegulatoryAuthorityComponent;
  let fixture: ComponentFixture<RegulatoryAuthorityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegulatoryAuthorityComponent]
    });
    fixture = TestBed.createComponent(RegulatoryAuthorityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
