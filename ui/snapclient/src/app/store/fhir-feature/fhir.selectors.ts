import {IAppState} from '../app.state';
import {createSelector} from '@ngrx/store';
import {IFhirState} from './fhir.reducer';

const selectModules = (state: IAppState) => state.fhir;

export const selectVersionList = createSelector(
    selectModules,
    (state: IFhirState) => state.versions
);

export const selectConceptSearchList = createSelector(
    selectModules,
    (state: IFhirState) => state.matches
);

export const selectSuggestions = createSelector(
    selectModules,
    (state: IFhirState) => state.suggests
);

export const selectConceptHierarcy = createSelector(
    selectModules,
    (state: IFhirState) => state.nodes
);

export const selectConceptProperties = createSelector(
    selectModules,
    (state: IFhirState) => state.properties
);

export const selectFhirError = createSelector(
    selectModules,
    (state: IFhirState) => state.errorMessage
);
