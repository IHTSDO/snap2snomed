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
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {Source} from '../_models/source';
import {ServiceUtils} from '../_utils/service_utils';
import {AppConfig, APP_CONFIG} from '../app.config';
import {MappingImportSource} from '../_models/mapping_import_source';
import {cloneDeep} from 'lodash';

interface Results {
  _embedded: any;
  _links: any;
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    count: number;
  };
}

interface ApiCallParams {
  contentType: string;
  url: string;
  header: { headers: HttpHeaders, params?: any };
}

@Injectable({
  providedIn: 'root'
})
export class SourceService {

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              private http: HttpClient) {
  }

  /** List of sources
   * API is Set to return max page size of 1000  - TODO return all
   * Update: increased limit to 10K in line with altering application.properties spring.data.rest.max-page-size=10000 for the user query
   * but potentially still need paging if that limit is exceeded.
   */
  fetchSources(): Observable<Results> {
    const url = `${this.config.apiBaseUrl}/importedCodeSets?size=10000&sort=name,asc`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.get<Results>(url, header);
  }

  importSource(source: Source | MappingImportSource | undefined, sourceType: string | undefined): Observable<any> {
    if (source === undefined || sourceType === undefined || !source.source_file) {
      return of(null);
    }
    const apiParams: ApiCallParams = this.getApiParams(
      `${this.config.apiBaseUrl}/importedCodeSets/import`,
      sourceType
    );
    const body = this.createSourceBody(source, apiParams.contentType);
    return this.http.post(apiParams.url, body, apiParams.header);
  }

  importMap(source: MappingImportSource | undefined, sourceType: string | undefined): Observable<any> {
    if (source === undefined || sourceType === undefined || !source.source_file) {
      return of(null);
    }
    const apiParams: ApiCallParams = this.getApiParams(
      `${this.config.apiBaseUrl}/importedMappings/import`,
      sourceType
    );
    const body = this.createSourceBody(source, apiParams.contentType);
    return this.http.post(apiParams.url, body, apiParams.header);
  }

  createSourceBody(source: Source | MappingImportSource, contentType: string ): FormData {
    const source_to_change = cloneDeep(source);
    const formData = new FormData();
    if (source_to_change) {
      if (source_to_change.source_file) {
        const blob = new Blob([source_to_change.source_file], {type: contentType});
        formData.append('file', blob);
      }
      source_to_change.source_file = undefined;
      const json = new Blob([JSON.stringify(source_to_change)], {type: 'application/json'});
      formData.append('importDetails', json);
    }
    return formData;
  }

  getApiParams(theUrl: string, sourceType: string): ApiCallParams {
    return {
      contentType: ServiceUtils.toMime(sourceType) ?? '',
      url: theUrl,
      header: ServiceUtils.getHTTPUploadHeaders()
    };
  }

}
