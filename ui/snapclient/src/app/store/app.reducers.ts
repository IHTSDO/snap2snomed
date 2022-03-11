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

import {ActionReducer, ActionReducerMap} from '@ngrx/store';
import {routerReducer} from '@ngrx/router-store';
import {IAppState, initialAppState} from './app.state';
import {authReducer} from './auth-feature/auth.reducer';
import {mappingReducer} from './mapping-feature/mapping.reducer';
import {sourceReducer} from './source-feature/source.reducer';
import {fhirReducer} from './fhir-feature/fhir.reducer';
import {localStorageSync} from 'ngrx-store-localstorage';
import {AuthActions, AuthActionTypes} from './auth-feature/auth.actions';
import {taskReducer} from './task-feature/task.reducer';

export const appReducers: ActionReducerMap<IAppState, any> = {
  router: routerReducer,
  auth: authReducer,
  mapping: mappingReducer,
  source: sourceReducer,
  fhir: fhirReducer,
  task: taskReducer,
};


export function flushStateReducer(reducer: ActionReducer<any>): (state: IAppState, action: AuthActions) => any {
  return (state: IAppState, action: AuthActions) => {
    if (action.type === AuthActionTypes.LOGOUT) {
      return reducer(initialAppState, action);
    } else {
      return reducer(state, action);
    }
  };
}

export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  const reducerKeys = Object.keys(appReducers);
  return localStorageSync({keys: reducerKeys, rehydrate: true})(reducer);
}


