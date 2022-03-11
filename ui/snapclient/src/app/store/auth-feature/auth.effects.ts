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

import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {catchError, concatMap, exhaustMap, map, switchMap, tap} from 'rxjs/operators';
import {
  AuthActions,
  AuthActionTypes,
  LoadUser,
  LoadUserFailure,
  LoadUserSuccess,
  LogInFailure,
  LogInSuccess,
  LogOut,
  RefreshFailure,
  RefreshSuccess,
  UnloadUser
} from './auth.actions';
import {Router} from '@angular/router';
import {of} from 'rxjs/internal/observable/of';
import {AuthService} from '../../_services/auth.service';
import {TokenMsg, User} from '../../_models/user';
import {UserService} from '../../_services/user.service';


@Injectable()
export class AuthEffects {

  logIn$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActionTypes.LOGIN),
    map(action => action.payload as string),
    switchMap((code) => this.authService.handleRedirectCallback(code).pipe(
      switchMap((res) => this.authService.getUserInfo(res.access_token).pipe(
        switchMap((userinfo) => of(new LogInSuccess({token: res, userinfo}))),
        catchError((err) => of(new LogInFailure({error: err})))
      ))))), {dispatch: true, useEffectsErrorHandler: false}
  );

  logInSuccess$ = createEffect(() => this.actions$.pipe(
      ofType(AuthActionTypes.LOGIN_SUCCESS),
      tap((user) => {
        this.authService.saveSessionAuth(user.payload.token.access_token, user.payload.userinfo.sub);
      }),
      map((u: any) => {
        const userinfo = u.payload.userinfo;
        const new_user = new User();
        new_user.id = userinfo.sub;
        new_user.givenName = userinfo.given_name;
        new_user.familyName = userinfo.family_name;
        new_user.email = userinfo.email;
        new_user.token = u.payload.token;
        new_user.acceptedTermsVersion = u.acceptedTermsVersion;
        return new_user;
      }),
      switchMap((user) => {
        return of(new LoadUser({user, navigation: true}));
      }),
    ), {dispatch: true}
  );

  logInFailed$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActionTypes.LOGIN_FAILED),
    switchMap(() => {
      return of(new LogOut());
    })
  ), {dispatch: true});

  logOut$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActionTypes.LOGOUT),
    map(() => {
      this.authService.logout();
      this.authService.clearSessionStorage();
    })
  ), {dispatch: false});

  refreshToken$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActionTypes.REFRESH),
    map(action => action.payload as TokenMsg),
    switchMap((tokenMsg) => this.authService.refreshAuthSession(tokenMsg).pipe(
      switchMap((token) => of(new RefreshSuccess({token}))),
      catchError((err) => of(new RefreshFailure({error: err})).pipe(
        concatMap(() => of(new LogOut()))))
    ))), {dispatch: true}
  );

  refreshTokenSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActionTypes.REFRESH_SUCCESS),
    map(() => {
      this.router.navigate([this.router.url], {replaceUrl: true});
    })
  ), {dispatch: false});

  loadUser$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActionTypes.LOAD_USER),
    map(action => action.payload),
    exhaustMap((payload) => this.userService.getUserById(payload.user).pipe(
      map((u: any) => {
        const new_user = new User();
        new_user.id = u.id;
        new_user.givenName = u.givenName;
        new_user.familyName = u.familyName;
        new_user.email = u.email;
        new_user.acceptedTermsVersion = u.acceptedTermsVersion;
        return new_user;
      }),
      switchMap((user1) => of(new LoadUserSuccess({user: user1, navigation: payload.navigation}))),
      catchError((error) => of(new LoadUserFailure({error})))
    ))), {dispatch: true}
  );

  loadUserSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActionTypes.LOAD_USER_SUCCESS),
    map(action => action.payload.navigation),
    map((navigation) => {
      if (navigation) {
        this.router.navigate([''], {replaceUrl: true});
      }
    })
  ), {dispatch: false});

  loadUserFailed$ = createEffect(() => this.actions$.pipe(
    ofType(AuthActionTypes.LOAD_USER_FAILED),
    map(action => action.payload.error),
    switchMap((error) => {
      if (error.error && error.error.status === 403 && error.error.detail.indexOf('not verified') > 0) {
        this.router.navigate([''], {replaceUrl: true});
        return of(new UnloadUser());
      }
      return of(new LogOut());
    })
  ), {dispatch: true});

  constructor(
    private actions$: Actions<AuthActions>,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
  ) {
  }

}
