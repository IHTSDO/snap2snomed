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
