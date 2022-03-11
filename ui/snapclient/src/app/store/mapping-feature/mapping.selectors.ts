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
