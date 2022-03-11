import {initialFhirState, fhirReducer} from './fhir.reducer';
import { LoadVersionsFailure, LoadVersionsSuccess } from './fhir.actions';

describe('Fhir Reducer', () => {
  describe('an unknown action', () => {
    it('should return the initial state', () => {
      const action = {} as any;
      const result = fhirReducer(initialFhirState, action);
      expect(result).toBe(initialFhirState);
    });
  });

  describe('a successful load action', () => {
    it('should return source', () => {
      const action = new LoadVersionsSuccess([{title: '', uri: ''}]);
      const result = fhirReducer(initialFhirState, action);
      expect(result.versions.length).toBe(1);
      expect(result.errorMessage).toBeFalsy();
    });
  });

  describe('a failed load action', () => {
    it('should return error msg', () => {
      const action = new LoadVersionsFailure({error: 'Load failed'});
      const result = fhirReducer(initialFhirState, action);
      expect(result.errorMessage).toBeTruthy();
      expect(result.versions.length).toBe(0);
    });
  });
});
