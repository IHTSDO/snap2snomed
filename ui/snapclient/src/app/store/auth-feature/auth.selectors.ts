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
