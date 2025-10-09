import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgLinkButtonComponent } from './ag-link-button.component';

describe('AgLinkButtonComponent', () => {
  let component: AgLinkButtonComponent;
  let fixture: ComponentFixture<AgLinkButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AgLinkButtonComponent]
    });
    fixture = TestBed.createComponent(AgLinkButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
