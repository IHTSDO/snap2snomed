import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable} from 'rxjs';

import {AuthEffects} from './auth.effects';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Routes} from '@angular/router';
import {AppComponent} from '../../app.component';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../app.state';
import { APP_CONFIG } from '../../app.config';
import {testRoutes} from '../../auth.guard.spec';



describe('AuthEffects', () => {
  let actions$: Observable<any>;
  let effects: AuthEffects;
  const routes = testRoutes;
  const initialState = initialAppState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(routes),
        HttpClientTestingModule
      ],
      providers: [
        AuthEffects,
        provideMockActions(() => actions$),
        provideMockStore({initialState}),
        { provide: APP_CONFIG, useValue: {} }
      ]
    });

    effects = TestBed.inject(AuthEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
