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
