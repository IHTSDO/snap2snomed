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

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { APP_CONFIG } from '../app.config';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErrorNotifier } from './errornotifier';
import { Snap2SnomedErrorHandler } from './snap2snomederrorhandler';
import { HttpLoaderFactory } from '../app.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Snap2SnomedHttpErrorInterceptor } from './snap2snomedhttperrorinterceptor';

describe('Snap2SnomedErrorHandler', () => {
  let handler: Snap2SnomedErrorHandler;
  let errorNotifier: ErrorNotifier;
  const apiUrl = 'https://localhost';
  const fhirUrl = 'https://secure.test.com';

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
        NoopAnimationsModule
      ],
      providers: [
        { provide: APP_CONFIG, useValue: {fhirBaseUrl: fhirUrl, apiBaseUrl: apiUrl} },
        TranslateService, ErrorNotifier, Snap2SnomedErrorHandler, Snap2SnomedHttpErrorInterceptor],
    });
    handler = TestBed.inject(Snap2SnomedErrorHandler);
    errorNotifier = TestBed.inject(ErrorNotifier);
  });

  it('should be created', () => {
    expect(handler).toBeTruthy();
  });

  it('should show service unavailable error', () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
      url: 'http://blah.com'
    });
    spyOn(errorNotifier.snackBar, 'open');
    handler.handleError(error);
    expect(errorNotifier.snackBar.open)
      .toHaveBeenCalledWith('ERROR.SERVICE_UNAVAILABLE', ' ', errorNotifier.snackBarOptions);
  });

  it('should show service error', () => {
    const error = new HttpErrorResponse({
      status: 404,
      statusText: 'Unknown Error',
      url: 'http://blah.com'
    });
    spyOn(errorNotifier.snackBar, 'open');
    handler.handleError(error);
    expect(errorNotifier.snackBar.open)
      .toHaveBeenCalledWith('ERROR.SERVICE_ISSUES', ' ', errorNotifier.snackBarOptions);
  });

});
