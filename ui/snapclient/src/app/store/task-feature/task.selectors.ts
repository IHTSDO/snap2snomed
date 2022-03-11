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

