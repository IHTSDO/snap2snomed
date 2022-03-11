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

import {Component, Inject, OnInit} from '@angular/core';
import {Task, TaskType} from '../../../app/_models/task';
import {MappedRowDetailsDto, MapRowRelationship, mapRowRelationships, MapRowStatus, MapView} from '../../../app/_models/map_row';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {authorStatuses, reviewStatuses} from '../../_models/map_row';
import {MappingDetails, MappingDto, MappingUpdateDto, MapService} from '../../../app/_services/map.service';
import {TranslateService} from '@ngx-translate/core';
import {ErrorInfo} from '../../../app/errormessage/errormessage.component';
import {MatRadioChange} from '@angular/material/radio';
import {ErrorNotifier} from '../../../app/errorhandler/errornotifier';
import {Mapping} from '../../../app/_models/mapping';
import { ServiceUtils } from 'src/app/_utils/service_utils';

export interface BulkChangeDialogData {
  task: Task | null | undefined;
  map: Mapping | null | undefined;
  isMapView: boolean | null | undefined;
  selectedRows: MappedRowDetailsDto[] | null | undefined;
}

export function getErrorMessage(translateService: TranslateService, err: any): string {
  let message = '';
  translateService.get('BULKCHANGEDIALOG.ERROR_DEFAULT_MESSAGE').subscribe((msg) => {
    message = msg;
  });
  return message;
}

export function getResultMessage(translateService: TranslateService, result: any): string {
  let msg = '';
  if (result.error) {
    msg = getErrorMessage(translateService, result);
  } else {
    const diff = result.rowCount - result.updatedRowCount;
    if (diff > 0) {
      translateService.get('BULKCHANGEDIALOG.UPDATED_ROWS_ERROR_MESSAGE',
        {
          selected: result.rowCount,
          updated: result.updatedRowCount,
          diff: result.rowCount - result.updatedRowCount
        })
          .subscribe(res => {
        msg = res;
      });
    } else {
      translateService.get('BULKCHANGEDIALOG.UPDATED_ROWS_MESSAGE',
        {
          selected: result.rowCount,
          updated: result.updatedRowCount,
          diff: result.rowCount - result.updatedRowCount
        })
          .subscribe(res => {
        msg = res;
      });
    }
  }
  return msg;
}

@Component({
  selector: 'app-bulkchange',
  templateUrl: './bulkchange.component.html',
  styleUrls: ['./bulkchange.component.css']
})
export class BulkchangeComponent implements OnInit {

  statuses: MapRowStatus[];
  relationships: MapRowRelationship[];
  noMap: boolean;
  clearNoMap: boolean;
  noMapValue: boolean | null | undefined;
  changedRelationship: string | null | undefined;
  changedStatus: string | null | undefined;
  clearTarget: boolean;
  error: ErrorInfo = {};
  changeTypes = ['ALL', 'SELECTED']
  changeType: string;
  isMapView: boolean;
  processing: boolean;

  constructor(
    public dialogRef: MatDialogRef<BulkchangeComponent>,
    private mapService: MapService,
    private errorNotifier: ErrorNotifier,
    private translateService: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: BulkChangeDialogData) {
    dialogRef.disableClose = true;
    this.relationships = mapRowRelationships;
    this.statuses = this.getStatuses(data.task);
    this.noMapValue = null;
    this.noMap = false;
    this.clearNoMap = false;
    this.clearTarget = false;
    this.changeType = 'ALL';
    this.isMapView = false;
      this.processing = false;
  }
  getStatuses(task: Task | null | undefined): MapRowStatus[] {
    let authStatuses = authorStatuses.filter(stat => stat !== MapRowStatus.UNMAPPED);
    if (task == null) {
      return authStatuses.concat(reviewStatuses);
    }
    if (task && task.type === TaskType.REVIEW) {
      return reviewStatuses;
    }
    return authStatuses;
  }

  ngOnInit(): void {
    this.isMapView = this.data.isMapView!;
    if (this.data.selectedRows && this.data.selectedRows.length > 0) {
      this.changeType = 'SELECTED';
    } else {
      this.changeType = 'ALL';
    }
  }

  onOk(): void {
    this.processing = true;
    if (this.noMap == false && this.clearNoMap == false) {
      this.noMapValue = null;
    }
    let mappingDto: MappingDto = {
      targetId: null,
      noMap: this.noMapValue,
      status: this.changedStatus,
      relationship: this.changedRelationship,
      clearTarget: !this.clearTarget ? null : true
    }

    if (this.changeType == 'ALL' && this.data.task) {
      // Bulk update all items for a task
      this.doBulkChange(this.mapService.bulkUpdateAllRowsForTask(this.data.task.id, mappingDto));
    } else if (this.changeType == 'ALL' && this.data.map) {
      // Bulk update all for a map
      this.doBulkChange(this.mapService.bulkUpdateAllRowsForMap(this.data.map.id!, mappingDto));
    } else {
      // Bulk update selected items
      const mappingDetails: MappingDetails[] = [];
      const mappingDto: MappingDto = {
        targetId: null,
        noMap: this.noMapValue,
        status: this.changedStatus,
        relationship: this.changedRelationship,
        clearTarget: !this.clearTarget ? null : true
      }
      let mappingDetail: MappingDetails = {
        rowId: null,
        taskId: this.data.task ? parseInt(this.data.task.id) : null,
        selection: this.data.selectedRows,
        mappingUpdate: mappingDto
      }
      mappingDetails.push(mappingDetail);
      const mappingUpdateDto: MappingUpdateDto = {
        mappingDetails: mappingDetails
      }
      this.doBulkChange(this.mapService.bulkUpdate(mappingUpdateDto));
    }
  }

  doBulkChange(serviceFunction: any): void {
      // Bulk update all for a map
      serviceFunction.subscribe((result: any) => {
        this.processing = false;
        this.dialogRef.close(result);
      },
      (err: any) => {
        this.processing = false;
        this.dialogRef.close(err);
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  setNoMap(checked: boolean): void {
    if (checked) {
      this.noMapValue = true;
      this.clearTarget = false;
      this.clearNoMap = false;
      this.changedStatus = null;
      this.changedRelationship = null;
    } else {
      this.noMapValue = null;
    }
  }

  setClearNoMap(checked: boolean): void {
    if (checked) {
      this.noMapValue = false;
      this.noMap = false;
      this.clearTarget = false;
      this.changedStatus = null;
      this.changedRelationship = null;
    } else {
      this.noMapValue = null;
    }
  }

  clearTargetClicked(checked: boolean): void {
    if (checked) {
      this.changedStatus = null;
      this.changedRelationship = null;
      this.noMapValue = null;
    }
  }

  setChangeTypeSelection($event: MatRadioChange): void {
    this.changeType = $event.value;
  }

}
