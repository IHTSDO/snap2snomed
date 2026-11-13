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

import { HttpClient, HttpParams } from '@angular/common/http';
import {Inject, Injectable} from '@angular/core';
import {APP_CONFIG, AppConfig} from '../app.config';
import {Observable} from 'rxjs';
import {ServiceUtils} from '../_utils/service_utils';
import {Task, TaskPageDetails, TaskType} from '../_models/task';
import {TaskResults} from './map.service';


@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              private http: HttpClient) {
  }

  /**
   * Get task for a specific map
   */
  getTasksByMapAndType(mapping_id: string, type: TaskType, pageSize: number | undefined, currentPage: number | undefined):
        Observable<{ page: TaskPageDetails, _embedded: { tasks: Task[] }, _links: any }> {
    let url = `${this.config.apiBaseUrl}/tasks`;
    const header = ServiceUtils.getHTTPHeaders();
    if (mapping_id) {
      url = `${this.config.apiBaseUrl}/tasks/search/findByMapIdAndType`;
      header.params = new HttpParams()
        .set('projection', 'embeddedTaskDetails')
        .set('id', mapping_id)
        .set('type', type)
        .set('page', currentPage ? currentPage.toString(): '')
        .set('size', pageSize? pageSize.toString(): '')
        .set('sort', "created,desc");
    }
    return this.http.get<TaskResults>(url, header);
  }

  /**
   * Create new task
   * @param task : Task
   */
  createTask(task: Task): Observable<any> {
    const url = `${this.config.apiBaseUrl}/tasks?projection=embeddedTaskDetails`;
    const header = ServiceUtils.getHTTPHeaders();
    let body = JSON.stringify(task, Task.replacer);
    body = body.replace('mapping', 'map');
    return this.http.post<TaskResults>(url, body, header);
  }

  /**
   * Delete a task
   * @param task : Task
   */
  deleteTask(task: Task): Observable<any> {
    const url = `${this.config.apiBaseUrl}/tasks/${task.id}`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.delete<TaskResults>(url, header);
  }

  /**
   * Complete a task - succeeds only if all rows are "done"
   * @param task : Task
   */
  completeTask(task: Task): Observable<any> {
    const url = `${this.config.apiBaseUrl}/task/${task.id}/$complete`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.post<TaskResults>(url, header);
  }

  /**
   * Determine the number of incomplete rows a task has
   * @param task : Task
   */
  getIncompleteRowSpecification(taskId: string): Observable<any> {
    const url = `${this.config.apiBaseUrl}/task/${taskId}/$countIncompleteRows`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.get<TaskResults>(url, header);
  }
}
