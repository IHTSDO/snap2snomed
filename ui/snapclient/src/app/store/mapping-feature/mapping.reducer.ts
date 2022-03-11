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

import {MappingActions, MappingActionTypes} from './mapping.actions';
import {Project, ProjectPage} from '../../_models/project';
import {Mapping} from '../../_models/mapping';
import {MappedRowDetailsDto, MapView, Page} from 'src/app/_models/map_row';
import { deepCopy } from '@angular-devkit/core/src/utils/object';


export interface IMappingState {
  projects: Project[];
  projectPage: ProjectPage | null;
  selectedMapping?: Mapping | null;
  selectedView: Page | null;
  selectedRows: MappedRowDetailsDto[];
  isLoading: boolean;
  errorMessage: any | null;
}

export const initialMappingState: IMappingState = {
  projects: [],
  projectPage: null,
  selectedMapping: null,
  selectedView: null,
  selectedRows: [],
  isLoading: false,
  errorMessage: null
};

export function mappingReducer(state = initialMappingState, action: MappingActions): IMappingState {
  switch (action.type) {

    case MappingActionTypes.LOAD_PROJECTS:
    case MappingActionTypes.ADD_MAPPING:
    case MappingActionTypes.COPY_MAPPING:
    case MappingActionTypes.UPDATE_MAPPING:
    case MappingActionTypes.LOAD_MAPPING:
    case MappingActionTypes.LOAD_MAP_VIEW:
    case MappingActionTypes.LOAD_TASK_VIEW:
      return {
        ...state,
        isLoading: true
      };

    /**
     * Load projects from db
     */
    case MappingActionTypes.LOAD_PROJECTS_SUCCESS:
      return {
        ...state,
        projects: action.payload.items,
        projectPage: action.payload.page,
        // selectedMapping: null,
        isLoading: false,
        errorMessage: null,
      };

    case MappingActionTypes.COPY_MAPPING_SUCCESS:
      const projects: any = state.projects.map((proj) => {
        if (proj.id === action.payload.project.id) {
          proj.maps = [...proj.maps, action.payload];
        }
        return proj;
      });
      return {
        ...state,
        projects,
        selectedMapping: null,
        isLoading: false,
        errorMessage: null
      };

    /**
     * Create a new map (and project)
     */
    case MappingActionTypes.ADD_MAPPING_SUCCESS:
      const project = {
        ...action.payload.project,
        maps: [action.payload]
      };
      return {
        ...state,
        projects: [...state.projects, project],
        selectedMapping: action.payload,
        isLoading: false,
        errorMessage: null
      };

    /**
     * Edit map title, description, version
     */
    case MappingActionTypes.UPDATE_MAPPING_SUCCESS: {
      const proj: Project = action.payload.project;
      const updatedProjects = getUpdatedProjects(proj);
      return {
        ...state,
        projects: updatedProjects,
        selectedMapping: action.payload,
        isLoading: false,
        errorMessage: null
      };
    }

    /**
     * Select a map from the list
     */
    case MappingActionTypes.LOAD_MAPPING_SUCCESS: {
      return {
        ...state,
        selectedMapping: action.payload,
        isLoading: false,
        errorMessage: null
      };
    }

    case MappingActionTypes.LOAD_MAP_VIEW_SUCCESS: {
      const result = action.payload;
      const rows = result.content.map(mv => MapView.create(mv as MapView));
      const page = new Page(rows, result.page.number, result.page.size,
        result.page.totalElements, result.page.totalPages, result.sourceDetails);

      return {
        ...state,
        selectedView: page,
        isLoading: false,
        errorMessage: null
      };
    }

    case MappingActionTypes.LOAD_PROJECTS_FAILED:
      return {
        ...state,
        projects: [],
        isLoading: false,
        errorMessage: action.payload.error
      };

    case MappingActionTypes.ADD_MAPPING_FAILED:
    case MappingActionTypes.COPY_MAPPING_FAILED:
      return {
        ...state,
        selectedMapping: null,
        isLoading: false,
        errorMessage: action.payload.error
      };

    case MappingActionTypes.UPDATE_MAPPING_FAILED:
      return {
        ...state,
        isLoading: false,
        errorMessage: action.payload.error
      };

    case MappingActionTypes.LOAD_MAPPING_FAILED:
      return {
        ...state,
        selectedMapping: null,
        isLoading: false,
        errorMessage: action.payload.error
      };

    case MappingActionTypes.LOAD_MAP_VIEW_FAILED: {
      return {
        ...state,
        selectedView: null,
        isLoading: false,
        errorMessage: action.payload.error
      };
    }

    case MappingActionTypes.NEW_MAPPING: {
      return {
        ...state,
        errorMessage: null,
        selectedMapping: null,
        isLoading: false,
      };
    }

    case MappingActionTypes.SELECT_MAP_ROW:
      return {
        ...state,
        selectedRows: deepCopy(action.payload.selectedrows)
      };

    default:
      return state;
  }

  function getUpdatedProjects(proj: Project): Project[] {
    return state.projects.map((p) => {
      if (p.id === proj.id) {
        return proj;
      } else {
        return p;
      }
    });
  }
}
