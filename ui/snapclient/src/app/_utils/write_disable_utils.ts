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

import {authorStatuses, MapRowStatus, reviewStatuses} from '../_models/map_row';
import {TaskType} from '../_models/task';
import {StatusUtils} from "./status_utils";

/**
 * Utilities used wherever it is necessary to determine if certain edit functions should be enabled or disabled
 */
export class WriteDisableUtils {
  /**
   * Used to control when the status of a row can be changed
   * @param task
   * @param status
   */
  static isStatusSelectionDisabled(taskType: TaskType | string | undefined, status: MapRowStatus | null | undefined): boolean {
    let disable = false;
    if (taskType && status) {
      disable = taskType as TaskType === TaskType.AUTHOR ? StatusUtils.inReviewedState(status) :
        (status === MapRowStatus.UNMAPPED || status === MapRowStatus.DRAFT);
    }
    return disable;
  }

  /**
   * Used to control when noMap and the row target are editable
   * @param task
   * @param status
   */
  static isEditDisabled(taskType: TaskType | string | undefined, status: MapRowStatus | null | undefined): boolean {
    return taskType && status ? taskType as TaskType === TaskType.REVIEW ||
      StatusUtils.inReviewedState(status as MapRowStatus) : false;
  }

  /**
   * Used to control when the flag on a row can be toggled
   * @param task
   * @param status
   */
  static isFlaggingDisabled(taskType: TaskType | string | undefined, status: MapRowStatus | null | undefined): boolean {
    let disable = false;
    if (taskType && status) {
      disable = taskType as TaskType === TaskType.AUTHOR ? reviewStatuses.includes(status) : authorStatuses.includes(status);
    }
    return disable;
  }
}
