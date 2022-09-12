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
import {IMappingState} from './mapping.reducer';

const selectModules = (state: IAppState) => state.mapping;

export const selectMappingState = createSelector(
  selectModules,
  (state: IMappingState) => state
);

export const selectProjects = createSelector(
  selectModules,
  (state: IMappingState) => state.projects
);

export const selectProjectPage = createSelector(
  selectModules,
  (state: IMappingState) => state.projectPage
);

export const selectCurrentMapping = createSelector(
  selectModules,
  (state: IMappingState) => state.selectedMapping
);

export const selectMappingError = createSelector(
  selectModules,
  (state: IMappingState) => state.errorMessage
);

export const selectMappingLoading = createSelector(
  selectModules,
  (state: IMappingState) => state.isLoading
);

export const selectCurrentView = createSelector(
  selectModules,
  (state: IMappingState) => state.selectedView
);

export const selectSelectedRows = createSelector(
  selectModules,
  (state: IMappingState) => state.selectedRows
);

export const selectAddEditMappingSuccess = createSelector(
  selectModules,
  (state: IMappingState) => state.addEditMappingSuccess
);
