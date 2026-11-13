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

import {Inject, Injectable, NgZone} from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AppConfig, APP_CONFIG} from '../app.config';
import {ErrorNotifier} from './errornotifier';
import {Snap2SnomedErrorHandler} from './snap2snomederrorhandler';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class Snap2SnomedHttpErrorInterceptor implements HttpInterceptor {

  constructor(private snap2SnomedErrorHandler: Snap2SnomedErrorHandler) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error) => {
        this.snap2SnomedErrorHandler.handleError(error);
        return throwError(error);
      })
    );
  }

}
