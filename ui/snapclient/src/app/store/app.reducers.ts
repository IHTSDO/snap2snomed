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


