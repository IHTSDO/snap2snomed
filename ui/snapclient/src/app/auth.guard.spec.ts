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
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {AuthGuard} from './auth.guard';
import {AppComponent} from './app.component';
import {HomeComponent} from './home/home.component';
import {RouterTestingModule} from '@angular/router/testing';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {AuthService} from './_services/auth.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {IAppState, initialAppState} from './store/app.state';
import {isAuthenticated} from './store/auth-feature/auth.selectors';
import {APP_CONFIG} from './app.config';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {testRoutes} from './test-routes';

describe('Auth Guard', () => {
  let guard: AuthGuard;
  let store: MockStore<IAppState>;
  let testAuthService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    declarations: [
        AppComponent,
        HomeComponent
    ],
    imports: [RouterTestingModule.withRoutes(testRoutes)],
    providers: [
        { provide: APP_CONFIG, useValue: {} },
        AuthGuard,
        provideMockStore({ initialState: initialAppState }),
        AuthService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});

    store = TestBed.inject(MockStore);
    guard = TestBed.inject(AuthGuard);
    testAuthService = TestBed.inject(AuthService);
  });

  it('should be creatable', () => expect(guard).toBeTruthy());


  it('should return false if the user state is NOT authenticated', () => {
    isAuthenticated.setResult(false);
    store.refreshState();
    const result = guard.canActivate(new ActivatedRouteSnapshot(), {url: ''} as RouterStateSnapshot);
    expect(result).toBe(false);
  });

  it('should return true if the user state is authenticated and authorized', () => {
    isAuthenticated.setResult(true);
    store.refreshState();
    const result = guard.canActivate(new ActivatedRouteSnapshot(), {url: ''} as RouterStateSnapshot);
    expect(result).toBe(true);
  });
});
