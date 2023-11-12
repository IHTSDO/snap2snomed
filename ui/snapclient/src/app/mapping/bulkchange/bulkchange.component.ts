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

import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {Task, TaskType} from '../../../app/_models/task';
import {MappedRowDetailsDto, MapRowRelationship, mapRowRelationships, MapRowStatus} from '../../../app/_models/map_row';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {authorStatuses, reviewStatuses} from '../../_models/map_row';
import {MappingDetails, MappingDto, MappingUpdateDto, MapService} from '../../../app/_services/map.service';
import {TranslateService} from '@ngx-translate/core';
import {ErrorInfo} from '../../../app/errormessage/errormessage.component';
import {ErrorNotifier} from '../../../app/errorhandler/errornotifier';
import {Mapping} from '../../../app/_models/mapping';
import {SelectionService} from "../../_services/selection.service";
import {Subscription} from "rxjs";
import {ConceptSearchComponent} from "../../concept-search/concept-search.component";

export interface BulkChangeDialogData {
  task: Task | null | undefined;
  map: Mapping | null | undefined;
  isMapView: boolean | null | undefined;
  selectedRows: MappedRowDetailsDto[] | null | undefined;
  allSelected: boolean;
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
  currentSelection: any;
  error: ErrorInfo = {};
  hasSearchValue: boolean;
  isMapView: boolean;
  processing: boolean;
  resetDualMap: boolean;
  allSelected: boolean;

  @ViewChild('searchComponent') searchComponent: ConceptSearchComponent | undefined;

  private subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<BulkchangeComponent>,
    private mapService: MapService,
    private errorNotifier: ErrorNotifier,
    private selectionService: SelectionService,
    @Inject(MAT_DIALOG_DATA) public data: BulkChangeDialogData) {
    dialogRef.disableClose = true;
    this.relationships = mapRowRelationships;
    this.statuses = [];
    this.noMapValue = null;
    this.noMap = false;
    this.clearNoMap = false;
    this.clearTarget = false;
    this.hasSearchValue = false;
    this.isMapView = false;
    this.processing = false;
    this.resetDualMap = false;
    this.allSelected = this.data.allSelected;
  }

  getStatuses(task: Task | null | undefined): MapRowStatus[] {
    let authStatuses = authorStatuses.filter(stat => stat !== MapRowStatus.UNMAPPED);
    let dualMapViewStatuses = [MapRowStatus.ACCEPTED, MapRowStatus.REJECTED, MapRowStatus.RECONCILE, MapRowStatus.INREVIEW]
    if (task == null) {
      if (this.isDualMapView()) {
        return dualMapViewStatuses;
      }
      else {
        return authStatuses.concat(reviewStatuses);
      }
    }
    if (task && task.type === TaskType.REVIEW) {
      return reviewStatuses;
    }
    return authStatuses;
  }

  ngOnInit(): void {
    const self = this;

    self.isMapView = self.data.isMapView!;
    this.statuses = this.getStatuses(self.data.task)

    if (!self.data.selectedRows || self.data.selectedRows.length == 0) {
      self.error = new Error("NO ROWS SELECTED")
    }

    self.subscription.add(self.selectionService.subscribeWithCurrent({
      next(selection: any): void {
        self.currentSelection = selection;
      },
      error(error): void {
        console.error('Selection error', error);
      }
    }));
  }

  ngAfterViewInit(): void {
    this.subscription.add(this.searchComponent?.searchControl.valueChanges
      .subscribe((value: string) => {
        if (value && !this.hasSearchValue) {
          this.hasSearchValue = true;
        }
        else if (!value && this.hasSearchValue) {
          this.hasSearchValue = false;
        }

        if (!value) {
          this.currentSelection = null;
        }
      }));
  }

  onOk(): void {
    this.processing = true;
    if (this.noMap == false && this.clearNoMap == false) {
      this.noMapValue = null;
    }
    // Bulk update selected items
    const mappingDetails: MappingDetails[] = [];
    const mappingDto: MappingDto = {
      targetId: null,
      target: this.currentSelection,
      noMap: this.noMapValue,
      status: this.changedStatus,
      relationship: this.changedRelationship,
      clearTarget: !this.clearTarget ? null : true,
      resetDualMap: this.resetDualMap
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
  
    if (this.allSelected) {
      if (this.data.map && this.data.map.id !== null) {
        this.doBulkChange(this.mapService.bulkUpdateAllRowsForMap(this.data.map.id, mappingUpdateDto));
      }
    }
    else {
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

  isDualMapView(): boolean {
    let isDualMapView = false;
    if (this.data.map) {
      isDualMapView = this.data.map.project.dualMapMode && this.isMapView;
    }
    return isDualMapView;
  }
}
