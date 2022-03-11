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

import {Inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Mapping} from '../_models/mapping';
import {Project} from '../_models/project';
import {Task} from '../_models/task';
import {ServiceUtils} from '../_utils/service_utils';
import {MappedRowDetailsDto, MapRow, MapRowRelationship, MapRowStatus, MapView} from '../_models/map_row';
import {JSONTargetRow, TargetRow} from '../_models/target_row';
import {Note} from '../_models/note';
import {APP_CONFIG, AppConfig} from '../app.config';
import {map} from 'rxjs/operators';
import {ImportMappingFileParams} from '../store/source-feature/source.actions';
import {ValidationResult} from "../_models/validation_result";

export interface Results {
  _embedded: any;
  _links: any;
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    count: number;
  };
}

export interface MapViewResults {
  content: MapView[];
  links: any;
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
  sourceDetails: MappedRowDetailsDto[];
}

export interface MapRowResults {
  _embedded: { mapRows: MapRow[] };
  _links: any;
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface MapRowTargetResults {
  _embedded: { mapRowTargets: JSONTargetRow[] };
  _links: any;
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface NoteResults {
  _embedded: { notes: Note[] };
  _links: any;
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface AutomapRow {
  id: number;
  display: string;
}

export interface MappingDetails {
  rowId: number | null;
  taskId: number | null;
  selection: MappedRowDetailsDto[] | null | undefined;
  mappingUpdate: MappingDto;
}

export interface MappingDto {
  targetId: number | null | undefined;
  noMap: boolean | null | undefined;
  status: string | null | undefined;
  relationship: string | null | undefined;
  clearTarget: boolean | null | undefined;
}

export interface MappingUpdateDto {
  mappingDetails: MappingDetails[];
}

export interface CreateMappingParams {
  mapping: Mapping;
  importFile: ImportMappingFileParams | undefined | null;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              private http: HttpClient) {
  }

  createProject(project: Project): Observable<any> {
    const url = `${this.config.apiBaseUrl}/projects`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = JSON.stringify(project, Project.replacer);

    return this.http.post(url, body, header);
  }

  createMapping(mapping: Mapping, projectid: string, sourceid: string): Observable<any> {
    const url = `${this.config.apiBaseUrl}/maps?projection=listView`;
    const header = ServiceUtils.getHTTPHeaders();
    mapping.project.id = projectid;
    mapping.source.id = sourceid;
    const body = JSON.stringify(mapping, Mapping.replacer);
    return this.http.post(url, body, header);
  }

  copyMapping(mapping: Mapping): Observable<any> {
    const url = `${this.config.apiBaseUrl}/map/${mapping.id}/newMappingVersion`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = JSON.stringify({
      sourceId: mapping.source.id,
      mapVersion: mapping.mapVersion,
      toVersion: mapping.toVersion,
      toScope: mapping.toScope
    });
    return this.http.post(url, body, header);
  }

  fetchProjects(pageSize: number, currentPage: number): Observable<Results> {
    const size = pageSize ?? 20;
    const page = currentPage ?? 0;
    const url = `${this.config.apiBaseUrl}/projects?sort=modified,desc&projection=listView&page=${page}&size=${size}`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.get<Results>(url, header);
  }

  getMapForId(id: string): Observable<Mapping> {
    const url = `${this.config.apiBaseUrl}/maps/${id}?projection=listView`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.get<Mapping>(url, header);
  }

  getMapsForProjectId(id: string): Observable<{ _embedded: { maps: Mapping[] }, _links: any }> {
    const url = `${this.config.apiBaseUrl}/projects/${id}/maps?projection=listView&sort=modified,desc`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.get<{ _embedded: { maps: Mapping[] }, _links: any }>(url, header);
  }

  updateMapping(mapping: Mapping): Observable<any> {
    const url = `${this.config.apiBaseUrl}/maps/${mapping.id}`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = JSON.stringify(mapping, Mapping.replacer);
    return this.http.put(url, body, header);
  }

  updateProject(project: Project): Observable<any> {
    const url = `${this.config.apiBaseUrl}/projects/${project.id}`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = JSON.stringify(project, Project.replacer);
    return this.http.put(url, body, header);
  }

  updateProjectRoles(project: Project): Observable<any> {
    const url = `${this.config.apiBaseUrl}/project/${project.id}/roles`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = JSON.stringify({
      owners: project.owners,
      members: project.members,
      guests: project.guests
    });
    return this.http.put(url, body, header).pipe();
  }

  getTaskAuthorRows(task_id: string): Observable<AutomapRow[]> {
    const url = `${this.config.apiBaseUrl}/task/${task_id}/automapRows`;
    const header = ServiceUtils.getHTTPHeaders();

    return this.http.get<AutomapRow[]>(url, header);
  }

  /**
   * Server-side pagination and filtering of mapViews
   * 1. Pagination              ?map=3&sort=sourceCode,asc&page=1
   * 2. Search filter (no page) ?map=3&sort=sourceCode,asc&sourceCode=ACHXYL
   * @param mapping       : Mapping ID
   * @param pageIndex     : page number from 0
   * @param pageSize      : number of results per page (default is 20)
   * @param sortColumn    : sort column as string eg sourceCode or status
   * @param sortDir       : sort direction eg asc or desc
   * @param filter        : search by column=value eg sourceCode=ACHXYL
   */
  getMapView(mapping: string,
             pageIndex: number = 0, pageSize: number = 20, sortColumn: string = '', sortDir: string | null = null,
             filter: HttpParams | null): Observable<MapViewResults> {

    const url = `${this.config.apiBaseUrl}/mapView/${mapping}`;

    return this.getView(url, pageIndex, pageSize, sortColumn, sortDir, filter);
  }

  /**
   * Server-side pagination and filtering of mapViews
   * 1. Pagination              ?map=3&sort=sourceCode,asc&page=1
   * 2. Search filter (no page) ?map=3&sort=sourceCode,asc&sourceCode=ACHXYL
   * @param task          : Task ID (or '')
   * @param pageIndex     : page number from 0
   * @param pageSize      : number of results per page (default is 20)
   * @param sortColumn    : sort column as string eg sourceCode or status
   * @param sortDir       : sort direction eg asc or desc
   * @param filter        : search by column=value eg sourceCode=ACHXYL
   */
  getTaskView(
    task: string,
    pageIndex: number = 0,
    pageSize: number = 20,
    sortColumn: string = '',
    sortDir: string | null = null,
    filter: HttpParams | null): Observable<MapViewResults> {

    const url = `${this.config.apiBaseUrl}/mapView/task/${task}`;

    return this.getView(url, pageIndex, pageSize, sortColumn, sortDir, filter);
  }

  private getView(
    url: string,
    pageIndex: number,
    pageSize: number,
    sortColumn: string,
    sortDir: string | null,
    filter: HttpParams | null): Observable<MapViewResults> {
    let params = new HttpParams();

    if (filter) {
      params = filter;
    }

    params = params.set('page', pageIndex.toString());

    if (pageSize) {
      params = params.set('size', pageSize.toString());
    }

    if (sortColumn && sortColumn.length > 0 && sortDir && sortDir.length > 0) {
      params = params.set('sort', `${sortColumn},${sortDir}`);
    }

    const header = ServiceUtils.getHTTPHeaders();
    header.params = params;
    return this.http.get<MapViewResults>(url, header);
  }

  /**
   * Update Map Row only - noMap and status
   * @param rowId
   * @param mapView
   * @private
   */
  updateMapRow(rowId: string, mapView: MapView): Observable<any> {
    const url = `${this.config.apiBaseUrl}/mapRows/${rowId}`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = {noMap: mapView.noMap, status: mapView.status};
    return this.http.patch<any>(url, body, header);
  }

  /**
   * update Target only
   *
   * @param mapView
   * @private
   */
  updateMapRowTarget(mapView: MapView): Observable<any> {
    const header = ServiceUtils.getHTTPHeaders();
    const rowId = mapView.rowId;

    const target: TargetRow = new TargetRow(
      `/mapRows/${rowId}`,
      mapView.targetId,
      mapView.targetCode,
      mapView.targetDisplay,
      getValidRelationship(mapView),
      mapView.flagged
    );
    const targetUrl = `${this.config.apiBaseUrl}/mapRowTargets`;

    if (target.id) {
      return this.http.put<any>(`${targetUrl}/${target.id}`, target, header).pipe(
        map(toTargetRow),
      );
    } else {
      return this.http.post<TargetRow>(targetUrl, target, header).pipe(
        map(toTargetRow),
      );
    }
  }

  /**
   * Switch NoMap on or off - and update MapRow status accordingly
   * @param rowId Id of row
   * @param noMap true or false
   */
  updateNoMap(rowId: string, noMap: boolean): Observable<any> {
    const url = `${this.config.apiBaseUrl}/mapRows/${rowId}`;
    const header = ServiceUtils.getHTTPHeaders();
    const status = noMap ? MapRowStatus.DRAFT : MapRowStatus.UNMAPPED;
    const body = {noMap, status};
    return this.http.patch<any>(url, body, header);
  }

  updateStatus(rowId: string, status: MapRowStatus): Observable<any> {
    const url = `${this.config.apiBaseUrl}/mapRows/${rowId}`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = {status};
    return this.http.patch<any>(url, body, header);
  }

  updateFlag(targetId: string, flagged: boolean): Observable<any> {
    const url = `${this.config.apiBaseUrl}/mapRowTargets/${targetId}`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = {flagged};
    return this.http.patch<any>(url, body, header);
  }

  exportMapView(mapping: string, contentType: string): Observable<Blob> {
    return this.http.get(`${this.config.apiBaseUrl}/mapView/${mapping}`,
      {
        headers: {Accept: contentType},
        responseType: 'blob'
      });
  }

  /**
   * Get Targets for Source Code
   */
  findTargetsForMap(map_id: string): Observable<MapRowTargetResults> {
    const url = `${this.config.apiBaseUrl}/mapRowTargets`;
    const header = ServiceUtils.getHTTPHeaders();
    header.params = new HttpParams()
      .set('projection', 'targetView')
      .set('row.map.id', map_id)
      .set('size', '1000000');
    return this.http.get<MapRowTargetResults>(url, header);
  }

  /**
   * Get Targets for Source Code
   */
  findTargetsBySourceIndex(map_id: string, source_idx: string): Observable<MapRowTargetResults> {
    const url = `${this.config.apiBaseUrl}/mapRowTargets`;
    const header = ServiceUtils.getHTTPHeaders();
    header.params = new HttpParams()
      .set('projection', 'targetView')
      .set('row.map.id', map_id)
      .set('row.sourceCode.index', source_idx);
    return this.http.get<MapRowTargetResults>(url, header);
  }

  createTarget(targetRow: TargetRow): Observable<any> {
    let url = `${this.config.apiBaseUrl}/mapRowTargets`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = JSON.stringify(targetRow, TargetRow.replacer);
    if (targetRow.id && targetRow.id !== '') {
      url = `${this.config.apiBaseUrl}/mapRowTargets/${targetRow.id}`;
      return this.http.put<TargetRow>(url, body, header);
    }
    return this.http.post<TargetRow>(url, body, header);
  }

  deleteTarget(targetId: string): Observable<any> {
    const url = `${this.config.apiBaseUrl}/mapRowTargets/${targetId}`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.delete<any>(url, header);
  }

  /**
   * Get all notes by Source Row ID
   * @param mapRow ID of MapRow
   */
  getNotesByMapRow(mapRow: string): Observable<NoteResults> {
    const url = `${this.config.apiBaseUrl}/notes/search/findByMapRowId`;
    const header = ServiceUtils.getHTTPHeaders();
    header.params = new HttpParams()
      .set('projection', 'noteView')
      .set('id', mapRow);
    return this.http.get<NoteResults>(url, header);
  }

  createNote(newNote: Note): Observable<Note> {
    const url = `${this.config.apiBaseUrl}/notes`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = JSON.stringify(newNote, Note.replacer);
    return this.http.post<Note>(url, body, header);
  }

  /**
   * Bulk Uodate Update mapping
   * @param mappingUpdate
   * @private
   */
  public bulkUpdate(mappingUpdate: MappingUpdateDto): Observable<any> {
    const url = `${this.config.apiBaseUrl}/updateMappingForSelected`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = mappingUpdate;
    return this.http.post<any>(url, body, header);
  }

  /**
   * Bulk update mapping for all rows in a task
   * @param mappingUpdate
   * @private
   */
  public bulkUpdateAllRowsForTask(taskId: string, mappingDto: MappingDto): Observable<any> {
    const url = `${this.config.apiBaseUrl}/updateMapping/task/${taskId}`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = mappingDto;
    return this.http.post<any>(url, body, header);
  }

  /**
   * Bulk update mapping for all rows in the map
   * @param mappingUpdate
   * @private
   */
  public bulkUpdateAllRowsForMap(mapId: string, mappingDto: MappingDto): Observable<any> {
    const url = `${this.config.apiBaseUrl}/updateMapping/map/${mapId}`;
    const header = ServiceUtils.getHTTPHeaders();
    const body = mappingDto;
    return this.http.post<any>(url, body, header);
  }

  public validateTargetCodes(mapId: string): Observable<ValidationResult> {
    const url = `${this.config.apiBaseUrl}/map/${mapId}/validateTargetCodes`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.get<ValidationResult>(url, header);
  }
}

function getValidRelationship(mapView: MapView): string | undefined {
  if (mapView.targetCode) {
    return mapView.relationship ?? MapRowRelationship.INEXACT;
  }
  return undefined;
}

function toTargetRow(result: any): TargetRow {
  const id = ServiceUtils.extractIdFromHref(result._links?.self.href, null);
  return new TargetRow(undefined, id, result.targetCode, result.targetDisplay,
    result.relationship, result.flagged);
}
