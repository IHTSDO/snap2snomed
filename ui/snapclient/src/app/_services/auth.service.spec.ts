import {TestBed} from '@angular/core/testing';

import {AuthService} from './auth.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {UserService} from './user.service';
import {initialAppState} from '../store/app.state';
import { APP_CONFIG } from '../app.config';

describe('AuthService', () => {
  let service: AuthService;

  const initialState = initialAppState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        { provide: APP_CONFIG, useValue: {} },
        provideMockStore({initialState}), AuthService, UserService],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
