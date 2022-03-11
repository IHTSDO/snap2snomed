import {TaskActions, TaskActionTypes} from './task.actions';
import {Task} from '../../_models/task';


export interface ITaskState {
  tasks: Task[];
  saveErrorMessage: any | null;
  loadErrorMessage: any | null;
  deleteErrorMessage: any | null;
  isLoading: boolean;
}

export const initialTasksState: ITaskState = {
  tasks: [],
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
        tasks: action.payload,
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
