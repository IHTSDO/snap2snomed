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

import {initialFhirState, fhirReducer} from './fhir.reducer';
import { LoadReleasesFailure, LoadReleasesSuccess } from './fhir.actions';
import { Release } from 'src/app/_services/fhir.service';

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
      let releases = new Map<string, Release[]>();
      let release : Release[] = [{
        edition: '',
        version: '',
        uri: ''
      }];
      releases.set('', release)
      const action = new LoadReleasesSuccess(releases);
      const result = fhirReducer(initialFhirState, action);
      expect(result.editionToVersionsMap!.size).toBe(1);
      expect(result.errorMessage).toBeFalsy();
    });
  });

  describe('a failed load action', () => {
    it('should return error msg', () => {
      const action = new LoadReleasesFailure({error: 'Load failed'});
      const result = fhirReducer(initialFhirState, action);
      expect(result.errorMessage).toBeTruthy();
      expect(result.editionToVersionsMap).toBeUndefined();
    });
  });
});
