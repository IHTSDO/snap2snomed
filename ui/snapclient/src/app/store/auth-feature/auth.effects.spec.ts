/*
 * Copyright © 2022 SNOMED International
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
