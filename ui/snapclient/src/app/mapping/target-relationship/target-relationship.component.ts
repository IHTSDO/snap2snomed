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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MapRowRelationship, mapRowRelationships, MapRowStatus, MapView, toMapRowStatus} from '../../_models/map_row';
import {MapService} from '../../_services/map.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {DroppableEventObject} from '../../_directives/droppable.directive';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {SelectionService} from 'src/app/_services/selection.service';
import {Task} from 'src/app/_models/task';
import {StatusUtils} from '../../_utils/status_utils';
import {SourceRow} from '../mapping-detail/mapping-detail.component';
import {WriteDisableUtils} from "../../_utils/write_disable_utils";

@Component({
  selector: 'app-target-relationship',
  templateUrl: './target-relationship.component.html',
  styleUrls: ['./target-relationship.component.css']
})
export class TargetRelationshipComponent implements OnInit {
  relationships: MapRowRelationship[] = [];
  error: ErrorInfo = {};
  selectedSearchItem: any = null;
  @Input() task: Task | null = null;
  @Input() targetRows: Array<MapView> = new Array<MapView>();
  @Input() source: SourceRow | null = null;
  @Input() disableActions = false;
  @Input() disableFlagging = false;
  @Output() newTargetEvent = new EventEmitter<MapView>();
  @Output() removeTargetEvent = new EventEmitter<MapView>();
  @Output() noMapEvent = new EventEmitter<boolean>();
  @Output() flagEvent = new EventEmitter<MapView>();

  writeDisableUtils = WriteDisableUtils;
  toMapRowStatus = toMapRowStatus;

  constructor(private mapService: MapService,
              private router: Router,
              private selectionService: SelectionService,
              private translate: TranslateService) {
    this.relationships = mapRowRelationships;
  }

  ngOnInit(): void {
    const self = this;
    self.selectionService.subscribe({
      next: (value: any) => {
        self.selectedSearchItem = value;
      }
    });
  }

  click(row: MapView): void {
    this.selectionService.select({
      code: row.targetCode,
      system: this.task?.mapping.toSystem ?? 'http://snomed.info/sct',
      version: this.task?.mapping.toVersion,
    });
  }

  /**
   * onDrop from search box (new item) or between relationships
   * @param event MapView object
   * @param relationship String relationship
   */
  onDrop(event: DroppableEventObject, relationship: string): void {
    const self = this;
    if (self.source && event.data && !StatusUtils.inReviewedState(self.source.status as MapRowStatus)) {
      if (!event.data.rowId) {
        self.addSelection(event.data.code, event.data.display, relationship);
      } else {
        const updatedTarget = self.targetRows.map((t) => t)
          .filter((m) => m.targetCode === event.data.targetCode)[0];
        updatedTarget.relationship = relationship;
        updatedTarget.status = MapRowStatus.DRAFT;
        updatedTarget.noMap = false;
        self.newTargetEvent.emit(updatedTarget);
      }
    }
  }

  filterRows(relationship: MapRowRelationship): MapView[] {
    return (this.targetRows && this.targetRows.length > 0) ? this.targetRows.map((m) => m).filter(
      (row) => row.relationship === relationship) : [];
  }

  addFocusTarget(relationship: MapRowRelationship): void {
    if (this.selectedSearchItem) {
      this.addSelection(this.selectedSearchItem.code, this.selectedSearchItem.display, relationship);
    }
  }

  addSelection(code: string, display: string, relationship: string): void {
    const self = this;
    if (self.source) {
      const targetRow = new MapView('', '', self.source.index, self.source.code,
        self.source.display, code, display, relationship, MapRowStatus.DRAFT,
        false, null, null, null, null, null, false);
      const duplicate = self.targetRows.find((row: any) => row.targetCode === targetRow.targetCode);
      if (!duplicate) {
        self.newTargetEvent.emit(targetRow);
        self.error = {}; // clear any duplicate errors
      } else {
        self.translate.get('ERROR.DUPLICATE_TARGET_ERROR').subscribe((res: any) => {
          self.error.message = res;
        });
      }
    }
  }

  removeTarget(targetRow: MapView): void {
    const self = this;
    self.removeTargetEvent.emit(targetRow);
  }

  isNoMap(): boolean {
    return this.source?.noMap ?? false;
  }

  updateFlag(maprow: MapView): void {
    const self = this;
    maprow.flagged = !maprow.flagged;
    self.flagEvent.emit(maprow);
  }
}
