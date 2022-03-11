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

import {HttpParams} from '@angular/common/http';
import {Action} from '@ngrx/store';
import {MappedRowDetailsDto, Page} from 'src/app/_models/map_row';
import {CreateMappingParams, MapViewResults} from 'src/app/_services/map.service';
import {Mapping} from '../../_models/mapping';
import {Project, ProjectPage} from '../../_models/project';

export type ViewContext = {
  pageIndex: number,
  pageSize: number,
  sortColumn?: string,
  sortDir?: string | null,
  filter: HttpParams,
};

export enum MappingActionTypes {
  LOAD_PROJECTS = '[Map] Load Projects',
  LOAD_PROJECTS_SUCCESS = '[Map] Load Projects Succeeded',
  LOAD_PROJECTS_FAILED = '[Map] Load Projects Failed',
  ADD_MAPPING = '[Map] Create Map',
  ADD_MAPPING_SUCCESS = '[Map] Create Map Succeeded',
  ADD_MAPPING_FAILED = '[Map] Create Map Failed',
  COPY_MAPPING = '[Map] Copy Map',
  COPY_MAPPING_SUCCESS = '[Map] Copy Map Succeeded',
  COPY_MAPPING_FAILED = '[Map] Copy Map Failed',
  UPDATE_MAPPING = '[Map] Update Map',
  UPDATE_MAPPING_SUCCESS = '[Map] Update Map Succeeded',
  UPDATE_MAPPING_FAILED = '[Map] Update Map Failed',
  LOAD_MAPPING = '[Map] Load Map',
  LOAD_MAPPING_SUCCESS = '[Map] Load Map Succeeded',
  LOAD_MAPPING_FAILED = '[Map] Load Map Failed',
  LOAD_MAP_VIEW = '[Map] Load Map View',
  LOAD_TASK_VIEW = '[Map] Load Task View',
  LOAD_MAP_VIEW_SUCCESS = '[Map] Load Map View Succeeded',  // also used for LOAD_TASK_VIEW
  LOAD_MAP_VIEW_FAILED = '[Map] Load Map View Failed',      // also used for LOAD_TASK_VIEW
  LOAD_SOURCE_VIEW = '[Map] Load Source View',
  LOAD_SOURCE_VIEW_SUCCESS = '[Map] Load Source View Succeeded',
  LOAD_SOURCE_VIEW_FAILED = '[Map] Load Source View Failed',
  FETCH_MAP_TASK = '[Map] Fetch Map Task',
  FETCH_MAP_TASK_SUCCESS = '[Map] Fetch Map Task Succeeded',
  FETCH_MAP_TASK_FAILED = '[Map] Fetch Map Task Failed',
  SELECT_MAP_ROW = '[Map] Select Map Row',
  NEW_MAPPING = '[Map] New Map'
}


export class LoadProjects implements Action {
  constructor(public payload: { pageSize: number; currentPage: number }) {
  }

  readonly type = MappingActionTypes.LOAD_PROJECTS;
}

export class LoadProjectsSuccess implements Action {
  readonly type = MappingActionTypes.LOAD_PROJECTS_SUCCESS;

  constructor(public payload: { items: Project[], page: ProjectPage }) {
  }
}

export class LoadProjectsFailure implements Action {
  readonly type = MappingActionTypes.LOAD_PROJECTS_FAILED;

  constructor(public payload: { error: any }) {

  }
}

export class AddMapping implements Action {
  readonly type = MappingActionTypes.ADD_MAPPING;

  constructor(public payload: CreateMappingParams) {

  }
}

export class AddMappingSuccess implements Action {
  readonly type = MappingActionTypes.ADD_MAPPING_SUCCESS;

  constructor(public payload: Mapping) {
  }
}


export class AddMappingFailure implements Action {
  readonly type = MappingActionTypes.ADD_MAPPING_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class CopyMapping implements Action {
  readonly type = MappingActionTypes.COPY_MAPPING;

  constructor(public payload: Mapping) {
  }
}

export class CopyMappingSuccess implements Action {
  readonly type = MappingActionTypes.COPY_MAPPING_SUCCESS;

  constructor(public payload: Mapping) {
  }
}

export class CopyMappingFailure implements Action {
  readonly type = MappingActionTypes.COPY_MAPPING_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class UpdateMapping implements Action {
  readonly type = MappingActionTypes.UPDATE_MAPPING;

  constructor(public payload: Mapping) {

  }
}

export class UpdateMappingSuccess implements Action {
  readonly type = MappingActionTypes.UPDATE_MAPPING_SUCCESS;

  constructor(public payload: Mapping) {
  }
}


export class UpdateMappingFailure implements Action {
  readonly type = MappingActionTypes.UPDATE_MAPPING_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class LoadMapping implements Action {
  readonly type = MappingActionTypes.LOAD_MAPPING;

  constructor(public payload: { id: string }) {

  }
}

export class LoadMappingSuccess implements Action {
  readonly type = MappingActionTypes.LOAD_MAPPING_SUCCESS;

  constructor(public payload: Mapping) {
  }
}


export class LoadMappingFailure implements Action {
  readonly type = MappingActionTypes.LOAD_MAPPING_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class LoadMapView implements Action {
  readonly type = MappingActionTypes.LOAD_MAP_VIEW;

  constructor(public payload: { mapping: string, context: ViewContext } ) {
  }
}

export class LoadTaskView implements Action {
  readonly type = MappingActionTypes.LOAD_TASK_VIEW;

  constructor(public payload: { task: string, context: ViewContext } ) {
  }
}

export class LoadMapViewSuccess implements Action {
  readonly type = MappingActionTypes.LOAD_MAP_VIEW_SUCCESS;

  constructor(public payload: MapViewResults) {
  }
}

export class LoadMapViewFailure implements Action {
  readonly type = MappingActionTypes.LOAD_MAP_VIEW_FAILED;

  constructor(public payload: { error: any }) {
  }
}

export class SelectMapRow implements Action {
  readonly type = MappingActionTypes.SELECT_MAP_ROW;

  constructor(public payload: { selectedrows: MappedRowDetailsDto[] }) {}
}

export class NewMapping implements Action {
  readonly type = MappingActionTypes.NEW_MAPPING;
  constructor(){}
}

export type MappingActions = LoadProjects
  | LoadProjectsSuccess
  | LoadProjectsFailure
  | AddMapping
  | AddMappingSuccess
  | AddMappingFailure
  | CopyMapping
  | CopyMappingSuccess
  | CopyMappingFailure
  | UpdateMapping
  | UpdateMappingSuccess
  | UpdateMappingFailure
  | LoadMapping
  | LoadMappingSuccess
  | LoadMappingFailure
  | LoadMapView
  | LoadTaskView
  | LoadMapViewSuccess
  | LoadMapViewFailure
  | SelectMapRow
  | NewMapping
  ;
