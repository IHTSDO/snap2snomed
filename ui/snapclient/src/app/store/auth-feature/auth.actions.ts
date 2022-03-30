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

import {Action} from '@ngrx/store';
import {TokenMsg, User, UserInfo} from '../../_models/user';

export enum AuthActionTypes {
  LOGIN = '[Auth] Login',
  LOGIN_SUCCESS = '[Auth] Login Succeeded',
  LOGIN_FAILED = '[Auth] Login Failed',
  LOGOUT = '[Auth] Logout',
  LOGOUT_FAILED = '[Auth] Logout from auth service failed',
  REFRESH = '[Auth] Refresh',
  REFRESH_SUCCESS = '[Auth] Refresh Succeeded',
  REFRESH_FAILED = '[Auth] Refresh Failed',
  LOAD_USER = '[Auth] User load request',
  LOAD_USER_SUCCESS = '[Auth] User load succeeded',
  LOAD_USER_FAILED = '[Auth] User load failed',
  UNLOAD_USER = '[Auth] Unload User'
}

export class LogIn implements Action {
  readonly type = AuthActionTypes.LOGIN;

  constructor(public payload: string) {
  }
}

export class LogInSuccess implements Action {
  readonly type = AuthActionTypes.LOGIN_SUCCESS;

  constructor(public payload: { token: TokenMsg, userinfo: UserInfo }) {
  }
}


export class LogInFailure implements Action {
  readonly type = AuthActionTypes.LOGIN_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class LogOut implements Action {
  readonly type = AuthActionTypes.LOGOUT;
}

export class LogOutFailure implements Action {
  readonly type = AuthActionTypes.LOGOUT_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class Refresh implements Action {
  readonly type = AuthActionTypes.REFRESH;

  constructor(public payload: TokenMsg | null | undefined) {
  }
}

export class RefreshSuccess implements Action {
  readonly type = AuthActionTypes.REFRESH_SUCCESS;

  constructor(public payload: { token: TokenMsg }) {
  }
}

export class RefreshFailure implements Action {
  readonly type = AuthActionTypes.REFRESH_FAILED;

  constructor(public payload: { error: any }) {
  }
}

/**
 * Load User to db (creates user with token)
 */
export class LoadUser implements Action {
  readonly type = AuthActionTypes.LOAD_USER;

  constructor(public payload: {user: User | null, navigation: boolean}) {
  }
}

export class LoadUserSuccess implements Action {
  readonly type = AuthActionTypes.LOAD_USER_SUCCESS;

  constructor(public payload: {user: User, navigation: boolean}) {
  }
}

export class LoadUserFailure implements Action {
  readonly type = AuthActionTypes.LOAD_USER_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class UnloadUser implements Action {
  readonly type = AuthActionTypes.UNLOAD_USER;

  constructor() {
  }
}


export type AuthActions = LogIn
  | LogInSuccess
  | LogInFailure
  | LogOut
  | LogOutFailure
  | Refresh
  | RefreshSuccess
  | RefreshFailure
  | LoadUser
  | LoadUserSuccess
  | LoadUserFailure
  | UnloadUser;
