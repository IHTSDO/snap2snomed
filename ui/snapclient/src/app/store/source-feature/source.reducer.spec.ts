import {initialSourceState, sourceReducer} from './source.reducer';
import {ImportSourceFailure, ImportSourceSuccess, InitSelectedSource, LoadSources} from './source.actions';
import {Source} from '../../_models/source';

describe('Source Reducer', () => {
  describe('an unknown action', () => {
    it('should return the initial state', () => {
      const action = {} as any;
      const result = sourceReducer(initialSourceState, action);
      expect(result).toBe(initialSourceState);
    });
  });

  describe('a successful import action', () => {
    it('should return source', () => {
      const action = new ImportSourceSuccess(new Source());
      const result = sourceReducer(initialSourceState, action);
      expect(result.selectedSource).toBeTruthy();
      expect(result.errorMessage).toBeFalsy();
    });
  });

  describe('a failed import action', () => {
    it('should return error msg', () => {
      const action = new ImportSourceFailure({error: 'Import failed'});
      const result = sourceReducer(initialSourceState, action);
      expect(result.errorMessage).toBeTruthy();
      expect(result.selectedSource).toBeFalsy();
    });
  });

  describe('a initialize selected source action', () => {
    it('should return null selected source', () => {
      const action = new InitSelectedSource();
      const result = sourceReducer(initialSourceState, action);
      expect(result.selectedSource).toBeFalsy();
      expect(result.errorMessage).toBeFalsy();
    });
  });

  describe('a load sources action', () => {
    it('should return loading', () => {
      const action = new LoadSources();
      const result = sourceReducer(initialSourceState, action);
      expect(result.isLoading).toBeTruthy();
    });
  });
});
