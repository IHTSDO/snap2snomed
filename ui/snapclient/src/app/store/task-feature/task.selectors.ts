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
import {ITaskState} from './task.reducer';

const selectModules = (state: IAppState) => state.task;


export const selectTaskList = createSelector(
  selectModules,
  (state: ITaskState) => state.tasks
);

export const selectTaskLoadError = createSelector(
  selectModules,
  (state: ITaskState) => state.loadErrorMessage
);

export const selectTaskSaveError = createSelector(
  selectModules,
  (state: ITaskState) => state.saveErrorMessage
);

export const selectTaskLoading = createSelector(
  selectModules,
  (state: ITaskState) => state.isLoading
);

export const selectTaskDeleteError = createSelector(
  selectModules,
  (state: ITaskState) => state.deleteErrorMessage
);

