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
import {Snap2SnomedHttpErrorInterceptor} from './snap2snomedhttperrorinterceptor';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {APP_CONFIG} from '../app.config';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {ErrorNotifier} from './errornotifier';
import {Snap2SnomedErrorHandler} from './snap2snomederrorhandler';
import {HttpLoaderFactory} from '../app.module';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {TokenInterceptor} from '../_services/token-interceptor.service';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../store/app.state';
import {selectAuthState, selectToken} from '../store/auth-feature/auth.selectors';
import {TokenMsg} from '../_models/user';
import {RouterTestingModule} from '@angular/router/testing';
import {testRoutes} from '../auth.guard.spec';
import { AuthService } from '../_services/auth.service';

describe('Snap2SnomedHttpErrorInterceptor', () => {
  let service: Snap2SnomedHttpErrorInterceptor;
  let tokenService: TokenInterceptor;
  let authService: AuthService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let errorNotifier: ErrorNotifier;
  let store: MockStore<IAppState>;
  const routes = testRoutes;
  const tokenMsg = new TokenMsg('blah', 'blah', 'blah', 'blah', 4);
  const initState = { user: {
      token: tokenMsg
    }
  };
  const url = 'https://secure.test.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        }),
        MatSnackBarModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes(routes)
      ],
      providers: [
        provideMockStore({
          initialState: initialAppState,
          selectors: [
            {selector: selectToken, value: tokenMsg},
            {selector: selectAuthState, value: {isAuthenticated: true, user: {token: tokenMsg}}}
          ]
        }),
        { provide: APP_CONFIG, useValue: {apiBaseUrl: url} },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: Snap2SnomedHttpErrorInterceptor, multi: true
        },
        { provide: HTTP_INTERCEPTORS,
          useClass: TokenInterceptor, multi: true
        },
        TranslateService, ErrorNotifier, Snap2SnomedErrorHandler, Snap2SnomedHttpErrorInterceptor],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(Snap2SnomedHttpErrorInterceptor);
    errorNotifier = TestBed.inject(ErrorNotifier);
    tokenService = TestBed.inject(TokenInterceptor);
    authService = TestBed.inject(AuthService);
    store = TestBed.inject(MockStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should intercept errors', () => {
    spyOn(errorNotifier.snackBar, 'open');
    spyOn(authService, 'isTokenExpired').and.returnValue(false);
    httpClient
      .get<string>(url)
      .subscribe(
        (data) => expect(data).toBeTruthy(),
        (error: HttpErrorResponse) => {
          expect(error).toBeTruthy();
        }
      );
    const req = httpMock.expectOne(url);
    const expectedResponse = new HttpResponse({status: 500, statusText: 'boom', body: {}});
    req.error(new ErrorEvent('500 error'), expectedResponse);
  });

  // Test that we don't show error notificaton for 401 api calls
  // The token-interceptor should take care of 401s
  it('should intercept errors but should not notify on 401 for api calls and refresh token should be called', () => {
    spyOn(errorNotifier.snackBar, 'open');
    spyOn(store, 'dispatch');
    spyOn(authService, 'refreshAuthSession').and.callThrough();
    httpClient
      .get<string>(url)
      .subscribe(
        (data) => expect(data).toBeTruthy(),
        (error: HttpErrorResponse) => {
          expect(error).toBeTruthy();
          expect(errorNotifier.snackBar.open).not.toHaveBeenCalledWith('ERROR.BACKEND_ISSUES', ' ',
                errorNotifier.snackBarOptions);
        }
      );
    const req = httpMock.expectOne('undefined/oauth2/token');
    const expectedResponse = new HttpResponse({status: 401, statusText: 'boom', body: {}});
    req.error(new ErrorEvent('401 error'), expectedResponse);
    expect(authService.refreshAuthSession).toHaveBeenCalledWith(tokenMsg);
  });

});
