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

import {RouterReducerState} from '@ngrx/router-store';
import {IAuthState, initialAuthState} from './auth-feature/auth.reducer';
import {IMappingState, initialMappingState} from './mapping-feature/mapping.reducer';
import {initialSourceState, ISourceState} from './source-feature/source.reducer';
import {IFhirState, initialFhirState} from './fhir-feature/fhir.reducer';
import {initialTasksState, ITaskState} from './task-feature/task.reducer';

export interface IAppState {
  router?: RouterReducerState;
  auth: IAuthState;
  mapping: IMappingState;
  source: ISourceState;
  fhir: IFhirState;
  task: ITaskState;
}

export const initialAppState: IAppState = {
  auth: initialAuthState,
  mapping: initialMappingState,
  source: initialSourceState,
  fhir: initialFhirState,
  task: initialTasksState,
};

export function getInitialState(): IAppState {
  return initialAppState;
}
