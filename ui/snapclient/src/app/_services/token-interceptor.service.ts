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

import {Inject, Injectable} from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpParams,
  HttpRequest
} from '@angular/common/http';
import {BehaviorSubject, Observable, Subject, throwError} from 'rxjs';
import {catchError, filter, finalize, map, switchMap, take} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {IAppState} from '../store/app.state';
import {Refresh, RefreshFailure, RefreshSuccess} from '../store/auth-feature/auth.actions';
import {selectAuthState, selectToken} from '../store/auth-feature/auth.selectors';
import {APP_CONFIG, AppConfig} from '../app.config';
import {AuthService} from './auth.service';
import {Router} from '@angular/router';
import {TokenMsg} from '../_models/user';

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptor implements HttpInterceptor {

  private proxyCors?: string;

  private token: TokenMsg | null | undefined;
  private refreshTokenInProgress = false;

  private refreshTokenSubject: Subject<any> = new BehaviorSubject<any>(null);

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              private authService: AuthService,
              private router: Router,
              public store: Store<IAppState>) {

    this.store.select(selectToken).subscribe((token) => {
      this.refreshTokenInProgress = false;
      this.token = token;
    });
  }

  private isApiRequest(request: HttpRequest<any>): boolean {
    return request.url?.startsWith(this.config.apiBaseUrl);
  }

  private isFhirRequest(request: HttpRequest<any>): boolean {
    return request.url?.startsWith(this.config.fhirBaseUrl);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let retries = 0;
    if (this.isFhirRequest(request) && this.proxyCors) {  // CORS proxying for SnowStorm
      const url = request.urlWithParams.replace(/%25/g, '%'); // Snowstorm
      const params: HttpParams = new HttpParams().set('url', url);
      request = request.clone({url: this.proxyCors, params});
      return next.handle(request);
    } else {
      // Refreshing tokens make the call
      if (request.url?.indexOf('/token') !== -1) {
        return next.handle(request);
      }
    }

    const tokenExpired = this.authService.isTokenExpired();

    if (this.token?.access_token && this.isApiRequest(request)) {
      if (!tokenExpired) {
        request = this.injectToken(request, this.token);
      } else {
        if (!this.refreshTokenInProgress) {
          this.refreshTokenInProgress = true;
          // Set the refreshTokenSubject to null so that subsequent API calls will wait until the new token has been retrieved
          this.refreshTokenSubject.next(null);
          return this.authService.refreshAuthSession(this.token).pipe(
            switchMap((authResponse) => {
              if (authResponse) {
                this.token = authResponse;
                this.refreshTokenSubject.next(authResponse);
                this.store.dispatch(new RefreshSuccess({token: authResponse}));
              } else {
                this.store.dispatch(new RefreshFailure( {error: authResponse}));
              }
              this.refreshTokenInProgress = false;
              return next.handle(this.injectToken(request, authResponse));
            }),
            finalize(() => {
              this.refreshTokenInProgress = false;
            }),
          );
        } else {
          return this.refreshTokenSubject.pipe(
            filter(result => result !== null && result !== undefined),
            take(1),
            switchMap((res) => {
                return next.handle(this.injectToken(request, res));
            })
          );
        }
      }
    }

    return next.handle(request).pipe(
      catchError((response, caught) => {
        if (response instanceof HttpErrorResponse && this.isApiRequest(request)) {
          if (retries === 0) {
            retries++;
            this.store.select(selectAuthState).pipe(
              map((state) => {
                if (state.isAuthenticated && state.user && state.user.token) {
                  if (response.status === 401 || (response.status === 403 &&
                    response.error?.details?.indexOf('denied') > 0)) {
                    this.store.dispatch(new Refresh(state.user.token));
                  }
                }
                return request;
              }),
              switchMap((req) => {
                return next.handle(req);
              })).subscribe().unsubscribe();
          }
        }
        if (response instanceof HttpErrorResponse && (response.status === 401 || response.status === 403)) {
          return new Observable<never>(subscriber => subscriber.unsubscribe());
        } else {
          return throwError(response);
        }
      }));
  }

  private injectToken(request: HttpRequest<any>, token: TokenMsg | null | undefined): HttpRequest<any> {
    return request = request.clone({setHeaders: {Authorization: `Bearer ${token?.access_token}`}});
  }

}
