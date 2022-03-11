import {HttpClient, HttpParams} from '@angular/common/http';
import {Inject, Injectable} from '@angular/core';
import {APP_CONFIG, AppConfig} from '../app.config';
import {Observable} from 'rxjs';
import {ServiceUtils} from '../_utils/service_utils';
import {Task} from '../_models/task';
import {Results} from './map.service';


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
  getTasksByMap(mapping_id: string): Observable<{ _embedded: { tasks: Task[] }, _links: any }> {
    let url = `${this.config.apiBaseUrl}/tasks`;
    const header = ServiceUtils.getHTTPHeaders();
    if (mapping_id !== '') {
      url = `${this.config.apiBaseUrl}/tasks/search/findByMapId`;
      header.params = new HttpParams().set('projection', 'embeddedTaskDetails').set('id', mapping_id);
    }
    return this.http.get<Results>(url, header);
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
    return this.http.post<Results>(url, body, header);
  }

  /**
   * Delete a task
   * @param task : Task
   */
  deleteTask(task: Task): Observable<any> {
    const url = `${this.config.apiBaseUrl}/tasks/${task.id}`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.delete<Results>(url, header);
  }

  /**
   * Complete a task - succeeds only if all rows are "done"
   * @param task : Task
   */
  completeTask(task: Task): Observable<any> {
    const url = `${this.config.apiBaseUrl}/task/${task.id}/$complete`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.post<Results>(url, header);
  }

  /**
   * Determine the number of incomplete rows a task has
   * @param task : Task
   */
  getIncompleteRowSpecification(taskId: string): Observable<any> {
    const url = `${this.config.apiBaseUrl}/task/${taskId}/$countIncompleteRows`;
    const header = ServiceUtils.getHTTPHeaders();
    return this.http.get<Results>(url, header);
  }
}
