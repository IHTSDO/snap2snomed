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

import {Project} from '../../_models/project';
import {initialMappingState, mappingReducer} from './mapping.reducer';
import {
  AddMappingFailure,
  AddMappingSuccess,
  LoadMappingFailure,
  LoadMappingSuccess,
  LoadProjectsFailure,
  LoadProjectsSuccess
} from './mapping.actions';
import {Mapping} from '../../_models/mapping';


describe('Mapping Reducer', () => {
  describe('an unknown action', () => {
    it('should return the initial state', () => {
      const action = {} as any;
      const result = mappingReducer(initialMappingState, action);

      expect(result).toBe(initialMappingState);
    });
  });

  describe('a successful Create Map Project action', () => {
    it('should add a Mapping Project to list', () => {
      const action = new AddMappingSuccess(new Mapping());
      const result = mappingReducer(initialMappingState, action);
      expect(result.projects).toBeTruthy();
      expect(result.projects.length).toBe(1);
    });
  });

  describe('a failed Create Map Project action', () => {
    it('should return error message', () => {
      const action = new AddMappingFailure({error: 'Create project map failed'});
      const result = mappingReducer(initialMappingState, action);
      expect(result.selectedMapping).toBeFalsy();
      expect(result.errorMessage).toBeTruthy();
    });
  });

  describe('a successful Load Projects action', () => {
    it('should show a list of Mapping Projects', () => {
      const action = new LoadProjectsSuccess({
        items: [new Project(), new Project()],
        page: {number: 0, totalPages: 2, size: 2, totalElements: 5}
      });
      const result = mappingReducer(initialMappingState, action);
      expect(result.selectedMapping).toBeFalsy();
      expect(result.errorMessage).toBeFalsy();
      expect(result.projects).toBeTruthy();
      expect(result.projects.length).toBe(2);
      expect(result.projectPage).toBeTruthy();
    });
  });

  describe('a failed Load Projects action', () => {
    it('should return error message', () => {
      const action = new LoadProjectsFailure({error: 'Load projects failed'});
      const result = mappingReducer(initialMappingState, action);
      expect(result.errorMessage).toBeTruthy();
    });
  });

  describe('a successful Load Map action', () => {
    it('should return Map', () => {
      const action = new LoadMappingSuccess(new Mapping());
      const result = mappingReducer(initialMappingState, action);
      expect(result.selectedMapping).toBeTruthy();
      expect(result.errorMessage).toBeFalsy();
    });
  });

  describe('a failed Load Map action', () => {
    it('should return error message', () => {
      const action = new LoadMappingFailure({error: 'Create project map failed'});
      const result = mappingReducer(initialMappingState, action);
      expect(result.selectedMapping).toBeFalsy();
      expect(result.errorMessage).toBeTruthy();
    });
  });
});
