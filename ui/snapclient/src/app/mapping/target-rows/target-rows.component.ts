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

import {Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {MatTable} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort} from '@angular/material/sort';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {MapRowStatus, mapRowStatuses, MapView} from '../../_models/map_row';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {ServiceUtils} from '../../_utils/service_utils';
import {Task, TaskType} from '../../_models/task';
import {StatusUtils} from '../../_utils/status_utils';

@Component({
  selector: 'app-target-rows',
  templateUrl: './target-rows.component.html',
  styleUrls: ['./target-rows.component.css']
})
export class TargetRowsComponent implements OnInit {
  displayedColumns: string[] = [
    'sourceDisplay',
    'targetDisplay',
    'relationship',
    'actions'
  ];

  // @ts-ignore
  @ViewChild('snackBarTemplate') snackBarTemplate: TemplateRef<any>;
  // @ts-ignore
  @ViewChild(MatTable) table: MatTable<any>;
  // @ts-ignore
  @ViewChild(MatPaginator) paginator: MatPaginator;
  // @ts-ignore
  @ViewChild(MatSort) sort: MatSort;

  @Input() dataSource: MapView[] = [];
  @Input() task: Task | null = null;
  @Input() status: MapRowStatus | string | null = null;
  @Output() removeTargetEvent = new EventEmitter<MapView>();
  @Output() updateFlagEvent = new EventEmitter<MapView>();

  statuses: MapRowStatus[] = mapRowStatuses;
  error: ErrorInfo = {};

  constructor(private snackBar: MatSnackBar,
              public translate: TranslateService) {

  }

  ngOnInit(): void {
  }

  sortData(sort: Sort): void {
    const data = this.dataSource.slice();
    if (!sort.active || sort.direction === '') {
      this.dataSource = data;
      return;
    }

    this.dataSource = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'relationship':
          return compare(a.relationship ?? '', b.relationship ?? '', isAsc);
        case 'targetCode':
          return compare(a.targetCode ?? '', b.targetCode ?? '', isAsc);
        case 'targetDisplay':
          return compare(a.targetDisplay ?? '', b.targetDisplay ?? '', isAsc);
        default:
          return 0;
      }
    });
  }

  dismiss(): void {
    this.snackBar.dismiss();
  }

  explainRelationship(relationship: string | null): string {
    return ServiceUtils.explainRelationship(this.translate, relationship);
  }

  removeRow(maprow: MapView): void {
    this.removeTargetEvent.emit(maprow);
  }

  updateFlagged(maprow: MapView): void {
    maprow.flagged = !maprow.flagged;
    this.updateFlagEvent.emit(maprow);
  }

  canDelete(): boolean {
    return (this.status && this.task) ? (this.task.type === TaskType.AUTHOR &&
      (StatusUtils.inAuthoredState(this.status as MapRowStatus) || this.status === MapRowStatus.REJECTED)) : false;
  }

}

function compare(a: number | string, b: number | string, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
