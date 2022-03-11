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

import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {catchError, map, mergeMap, repeat, switchMap, tap} from 'rxjs/operators';
import {of} from 'rxjs/internal/observable/of';
import {TaskService} from '../../_services/task.service';
import {
  AddTaskFailure,
  AddTaskSuccess,
  DeleteTaskFailure,
  DeleteTaskSuccess,
  LoadTasksFailure,
  LoadTasksForMap,
  LoadTasksSuccess,
  TaskActions,
  TaskActionTypes,
} from './task.actions';
import {Task} from '../../_models/task';
import {ServiceUtils} from 'src/app/_utils/service_utils';
import {User} from 'src/app/_models/user';
import {Router} from '@angular/router';
import {LoadMapping} from '../mapping-feature/mapping.actions';


@Injectable()
export class TaskEffects {

  constructor(
    private actions$: Actions<TaskActions>,
    private taskService: TaskService,
    private router: Router) {
  }

  loadTasksForMap$ = createEffect(() => this.actions$.pipe(
    ofType(TaskActionTypes.LOAD_TASKS_FOR_MAP),
    map((action) => action.payload),
    switchMap((payload) => this.taskService.getTasksByMap(payload.id).pipe(
      map((resp) => resp._embedded.tasks as Task[]),
      map((tasks: Task[]) => tasks.map(TaskEffects.mapTaskFromPayload)),
      switchMap((tasks: Task[]) => of(new LoadTasksSuccess(tasks))),
      catchError((err) => of(new LoadTasksFailure({error: err})))
    ))), {dispatch: true});

  addTask$ = createEffect(() => this.actions$.pipe(
    ofType(TaskActionTypes.ADD_TASK),
    map((action) => action.payload as Task),
    switchMap((addtask: Task) => this.taskService.createTask(addtask).pipe(
      map(TaskEffects.mapTaskFromPayload)
    )),
    switchMap((task: Task) => of(new AddTaskSuccess(task))),
    catchError((err) => of(new AddTaskFailure({error: err}))),
    repeat()
  ), {dispatch: true});

  addTaskSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(TaskActionTypes.ADD_TASK_SUCCESS),
    mergeMap((action) => {
      const task = action.payload as Task;
      return of(new LoadMapping({id: task.mapping.id ?? ''}));
    })
  ), {dispatch: true});

  deleteTask$ = createEffect(() => this.actions$.pipe(
    ofType(TaskActionTypes.DELETE_TASK),
    switchMap((action) => {
      const task = action.payload as Task;
      return this.taskService.deleteTask(task).pipe(
        switchMap(() => of(new DeleteTaskSuccess(task))),
        catchError((error: any) => of(new DeleteTaskFailure({error}))),
      );
    }),
  ), {dispatch: true});

  completeTask$ = createEffect(() => this.actions$.pipe(
    ofType(TaskActionTypes.COMPLETE_TASK),
    switchMap((action) => {
      const task = action.payload as Task;
      return this.taskService.completeTask(task).pipe(
        switchMap(() => of(new DeleteTaskSuccess(task))),
        catchError((error: any) => of(new DeleteTaskFailure({error}))),
      );
    }),
  ), {dispatch: true});

  deleteTaskSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(TaskActionTypes.DELETE_TASK_SUCCESS),
    mergeMap((action) => {
      const task = action.payload as Task;
      return of(new LoadMapping({id: task.mapping.id ?? ''}));
    })
  ), {dispatch: true});


  private static mapAssignee(task: any): User {
    const user = new User();
    return {
      ...user,
      id: task.assigneeId,
      givenName: task.assignee.givenName,
      familyName: task.assignee.familyName,
      email: task.assignee.email
    };
  }

  private static mapTaskFromPayload(task: any): Task {
    task.id = ServiceUtils.extractIdFromHref(task._links?.self.href, null);
    task.assignee = TaskEffects.mapAssignee(task);
    task.mapping = {...task.map, id: '' + task.mapId, project: task.mapProject, source: task.source};
    return new Task(task.id, task.type, task.description,
      task.mapping, task.assignee,
      task.sourceRowSpecification, task.sourceRowCount, task.created,
      task.modified, task.reassignAlreadyAssignedRows,
      task.allowAssigneeToBeAuthorAndReviewer);
  }

}
