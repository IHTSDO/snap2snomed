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

import {authorStatuses, MapRowStatus, mapRowStatuses, MapView, reviewStatuses} from '../_models/map_row';
import {TaskType} from '../_models/task';

export class StatusUtils {

  /**
   *  Under Authoring
   */
  static inAuthoredState(status: MapRowStatus): boolean {
    return authorStatuses.filter((s) => s !== MapRowStatus.UNMAPPED)
      .includes(status);
  }

  /**
   * Under Review or Completed Review
   */
  static inReviewedState(status: MapRowStatus): boolean {
    return reviewStatuses.filter((s) => s !== MapRowStatus.REJECTED)
    .includes(status);
  }

  /**
   *  Disable status option in dropdown
   *  Note: Workflow is broken - Review should not access MAPPED at all or any other non-review state
   */
  static isStatusOptionDisabled(taskType: TaskType | string, mapView: MapView, statusOption: MapRowStatus): boolean {
    let disableStatus = false;
    switch (taskType) {
      case TaskType.REVIEW:
        if (mapView.status === MapRowStatus.UNMAPPED || mapView.status === MapRowStatus.DRAFT) {
          disableStatus = true;
        } else {
          disableStatus = authorStatuses.includes(statusOption);
        }
        break;
      case TaskType.AUTHOR:
        if (mapView.status === MapRowStatus.UNMAPPED) {
          disableStatus = statusOption !== MapRowStatus.UNMAPPED;
        } else if (this.inReviewedState(mapView.status as MapRowStatus)) {
          disableStatus = true;
        } else if (this.inAuthoredState(mapView.status as MapRowStatus) || mapView.status === MapRowStatus.REJECTED) {
          disableStatus = statusOption === MapRowStatus.UNMAPPED || reviewStatuses.includes(statusOption);
        }
        break;
      default:
        disableStatus = false;
    }

    return disableStatus;
  }

  /**
   * getAvailableStatusOptions for status toggle
   */
  static getAvailableStatusOptions(taskType: TaskType, status: MapRowStatus): MapRowStatus[] {
    let statusList: MapRowStatus[] = mapRowStatuses;
    switch (taskType) {
      case TaskType.AUTHOR:
        if (status === MapRowStatus.UNMAPPED) {
          statusList = [MapRowStatus.UNMAPPED];
        } else if (status === MapRowStatus.REJECTED) {
          statusList = authorStatuses.filter((m) => m !== MapRowStatus.UNMAPPED).concat([MapRowStatus.REJECTED])
        } else if (this.inAuthoredState(status)) {
          statusList = authorStatuses.filter((m) => m !== MapRowStatus.UNMAPPED);
        } else if (this.inReviewedState(status)) {
          statusList = [status as MapRowStatus];
        }
        break;
      case TaskType.REVIEW:
        if (status === MapRowStatus.UNMAPPED || status === MapRowStatus.DRAFT) {
          statusList = [status];
        } else if (status === MapRowStatus.MAPPED) {
          statusList = [MapRowStatus.MAPPED].concat(reviewStatuses);
        } else {
          statusList = reviewStatuses;
        }
        break;
    }
    return statusList;
  }
}
