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

import {TaskActions, TaskActionTypes} from './task.actions';
import {Task, TaskPageDetails, TaskPageForType} from '../../_models/task';


export interface ITaskState {
  tasks: Task[];
  alltasks: TaskPageForType[];
  saveErrorMessage: any | null;
  loadErrorMessage: any | null;
  deleteErrorMessage: any | null;
  isLoading: boolean;
}

export const initialTasksState: ITaskState = {
  tasks: [],
  alltasks: [],
  saveErrorMessage: null,
  loadErrorMessage: null,
  deleteErrorMessage: null,
  isLoading: false
};

export function taskReducer(state = initialTasksState, action: TaskActions): ITaskState {
  switch (action.type) {

    case TaskActionTypes.LOAD_TASKS_FOR_MAP:
      return {
        ...state,
        isLoading: true,
        loadErrorMessage: null,
        saveErrorMessage: null,
        deleteErrorMessage: null,
        tasks: []
      };

    case TaskActionTypes.LOAD_TASKS_SUCCESS:
      return {
        ...state,
        tasks: action.payload.tasks,
        loadErrorMessage: null,
        saveErrorMessage: null,
        deleteErrorMessage: null,
        isLoading: false
      };

    case TaskActionTypes.LOAD_ALL_TASKS_SUCCESS:
      return {
        ...state,
        tasks: action.payload.tasks,
        alltasks: action.payload.taskPages,
        loadErrorMessage: null,
        saveErrorMessage: null,
        deleteErrorMessage: null,
        isLoading: false
      };

      case TaskActionTypes.LOAD_TASKS_FAILED:
      return {
        ...state,
        tasks: [],
        loadErrorMessage: action.payload.error,
        isLoading: false
      };

    case TaskActionTypes.ADD_TASK_SUCCESS:
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
        saveErrorMessage: null,
        deleteErrorMessage: null,
        isLoading: false
      };

    case TaskActionTypes.ADD_TASK_FAILED:
      return {
        ...state,
        saveErrorMessage: action.payload,
        isLoading: false
      };

    case TaskActionTypes.DELETE_TASK_SUCCESS:
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload.id),
        deleteErrorMessage: null,
      };

    case TaskActionTypes.DELETE_TASK_FAILED:
      return {
        ...state,
        deleteErrorMessage: action.payload.error,
      };

    default:
      return state;
  }
}
