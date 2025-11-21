import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderMenusComponent } from './header-menus.component';

describe('HeaderMenusComponent', () => {
  let component: HeaderMenusComponent;
  let fixture: ComponentFixture<HeaderMenusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HeaderMenusComponent]
    });
    fixture = TestBed.createComponent(HeaderMenusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
