import {IAppState} from '../app.state';
import {createSelector} from '@ngrx/store';
import {IAuthState} from './auth.reducer';

const selectModules = (state: IAppState) => state.auth;

export const selectAuthState = createSelector(
    selectModules,
    (state: IAuthState) => state
);

export const isAuthenticated = createSelector(
    selectModules,
    (state: IAuthState) => state.isAuthenticated
);

export const selectToken = createSelector(
    selectModules,
    (state: IAuthState) => state.user?.token
);

export const selectAuthUser = createSelector(
  selectModules,
  (state: IAuthState) => state.user
);

export const selectCurrentUser = createSelector(
    selectModules,
    (state: IAuthState) => state.currentuser
);

export const selectCurrentUserError = createSelector(
  selectModules,
  (state: IAuthState) => state.errorMessage
);
