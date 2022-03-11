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
import {ISourceState} from './source.reducer';

const selectModules = (state: IAppState) => state.source;

export const selectSourceState = createSelector(
  selectModules,
  (state: ISourceState) => state
);

export const selectSourceList = createSelector(
  selectModules,
  (state: ISourceState) => state.sources
);

export const selectSourceError = createSelector(
  selectModules,
  (state: ISourceState) => state.errorMessage
);

export const selectSource = createSelector(
  selectModules,
  (state: ISourceState) => state.selectedSource
);

export const selectMappingFile = createSelector(
  selectModules,
  (state: ISourceState) => state.selectedMappingFile
);

export const selectSourceLoading = createSelector(
  selectModules,
  (state: ISourceState) => state.isLoading
);

export const selectMappingFileLoading = createSelector(
  selectModules,
  (state: ISourceState) => state.isMappingFileLoading
);

export const selectMappingFileSuccess = createSelector(
  selectModules,
  (state: ISourceState) => state.loadedMappingFile
);

export const selectMappingFileError = createSelector(
  selectModules,
  (state: ISourceState) => state.errorMessage
);
