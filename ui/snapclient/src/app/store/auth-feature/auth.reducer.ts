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

import {AuthActions, AuthActionTypes} from './auth.actions';
import {User} from '../../_models/user';


export interface IAuthState {
  isAuthenticated: boolean;
  user: User | null;                      // authenticated user
  currentuser: User | null;               // db user
  errorMessage: any | null;
}

export const initialAuthState: IAuthState = {
  isAuthenticated: false,
  user: null,
  currentuser: null,
  errorMessage: null
};

export function authReducer(state = initialAuthState, action: AuthActions): IAuthState {
  switch (action.type) {
    case AuthActionTypes.LOGIN:
      return initialAuthState;

    case AuthActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: {
          token: action.payload.token,
          id: action.payload.userinfo.sub,
          givenName: action.payload.userinfo.given_name,
          familyName: action.payload.userinfo.family_name,
          email: action.payload.userinfo.email
        },
        currentuser: null,
        errorMessage: null
      };

    case AuthActionTypes.LOGIN_FAILED:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        currentuser: null,
        errorMessage: action.payload.error
      };

    case AuthActionTypes.LOGOUT: {
      return initialAuthState;
    }

    case AuthActionTypes.REFRESH_SUCCESS: {
      if (state.user && state.user.token) {
        return {
          ...state,
          isAuthenticated: true,
          currentuser: Object.assign({}, state.currentuser, state.user),
          user: {
            ...state.user,
            token: {
              ...state.user.token,
              access_token: action.payload.token.access_token,
              id_token: action.payload.token.id_token
            }
          },
          errorMessage: null
        };
      }
      return state;
    }

    case AuthActionTypes.LOAD_USER_SUCCESS: {
      return {
        ...state,
        currentuser: action.payload.user,
        errorMessage: null
      };
    }

    case AuthActionTypes.LOAD_USER_FAILED: {
      return {
        ...state,
        currentuser: null,
        errorMessage: action.payload.error
      };
    }

    case AuthActionTypes.UNLOAD_USER: {
      return {
        ...state,
        currentuser: null,
        user: null,
        isAuthenticated: false
      };
    }

    default:
      return state;
  }
}
