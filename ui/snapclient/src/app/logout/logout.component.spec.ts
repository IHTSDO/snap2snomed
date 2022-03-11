import {ComponentFixture, TestBed} from '@angular/core/testing';

import {LogoutComponent} from './logout.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {APP_CONFIG} from '../app.config';
import {provideMockStore} from '@ngrx/store/testing';
import {AuthService} from '../_services/auth.service';
import {initialAppState} from '../store/app.state';

describe('LogoutComponent', () => {
  let component: LogoutComponent;
  let fixture: ComponentFixture<LogoutComponent>;
  const initialState = initialAppState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        { provide: APP_CONFIG, useValue: {} },
        provideMockStore({initialState}), AuthService],
      declarations: [ LogoutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
