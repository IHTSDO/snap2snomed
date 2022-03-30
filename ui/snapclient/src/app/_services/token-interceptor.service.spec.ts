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

import {TokenInterceptor} from './token-interceptor.service';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../store/app.state';
import {HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse, HttpRequest, HttpResponse} from '@angular/common/http';
import {APP_CONFIG} from '../app.config';
import {take} from 'rxjs/operators';
import {of} from 'rxjs';
import {RouterTestingModule} from '@angular/router/testing';
import {testRoutes} from '../auth.guard.spec';

describe('TokenInterceptorService', () => {
  let service: TokenInterceptor;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  const routes = testRoutes;
  const initialState = initialAppState;
  const url = 'https://secure.test.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(routes),
        HttpClientTestingModule
      ],
      providers: [provideMockStore({initialState}),
        {provide: APP_CONFIG, useValue: {}, HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true}],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TokenInterceptor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not intercept 201 errors', () => {
    const testData = 'test';
    httpClient
      .get<string>(url)
      .subscribe(
        (data) => expect(data).toBeTruthy(),
        (error: HttpErrorResponse) => expect(error).toBeFalsy()
      );
    const req = httpMock.expectOne(url);
    const expectedResponse = new HttpResponse({status: 201, statusText: 'Created', body: {}});
    req.flush(testData, expectedResponse);
  });

  it('should intercept 401 errors', () => {
    const expectedResponse = new HttpResponse({status: 401, statusText: 'Unauth', body: {}});
    httpClient
      .get<string>(url)
      .subscribe(
        (data) => fail('error'),
        (error: HttpErrorResponse) => expect(error).toBeTruthy()
      );
    const req = httpMock.expectOne(url);
    const next: any = {
      handle: jasmine.createSpy('handle').and.callFake(() => of(expectedResponse))
    };
    service.intercept(expectedResponse as unknown as HttpRequest<any>, next).pipe(take(1)).subscribe();
    req.error(new ErrorEvent('401 error'), expectedResponse);
  });

  it('should throw 400 errors', () => {
    const expectedResponse = new HttpErrorResponse({status: 400, statusText: 'Unauth'});
    httpClient
      .get<string>(url)
      .subscribe(
        (data) => fail('error'),
        (error: HttpErrorResponse) => expect(error).toBeTruthy()
      );
    const req = httpMock.expectOne(url);
    const next: any = {
      handle: jasmine.createSpy('handle').and.callFake(() => of(expectedResponse))
    };
    service.intercept(expectedResponse as unknown as HttpRequest<any>, next).pipe(take(1)).subscribe();
    req.error(new ErrorEvent('400 error'), expectedResponse);
  });
});
