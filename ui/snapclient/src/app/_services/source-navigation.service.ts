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
import {BehaviorSubject, of} from 'rxjs';
import {MapView, Page} from '../_models/map_row';
import {catchError, map} from 'rxjs/operators';
import {MapService} from './map.service';
import {ViewContext} from '../store/mapping-feature/mapping.actions';
import { Mapping } from '../_models/mapping';
import { Task, TaskType } from '../_models/task';

export interface MapViewParams {
  page: Page;
  rowIndex: number;
  params: ViewContext;
}

export interface SourceNavSet {
  mapRow: MapView | null;
  siblingRow: MapView | null;
  current: MapViewParams | null;
  previous: MapViewParams | null;
  next: MapViewParams | null;
}

export const initialSourceNav: SourceNavSet = {
  mapRow: null,
  siblingRow: null,
  current: null,
  previous: null,
  next: null
};

@Injectable({
  providedIn: 'root'
})
export class SourceNavigationService {

  constructor(private mapService: MapService) {
  }

  private selectedRow = new BehaviorSubject<SourceNavSet>(initialSourceNav);
  selectedRow$ = this.selectedRow.asObservable();

  private static prevUniqueRow(data: MapView[], row_idx: number, sourceIndex: string): number | null {
    for (let i = row_idx; i >= 0; i--) {
      if (sourceIndex !== data[i].sourceIndex) {
        return i;
      }
    }
    return null;
  }

  private static nextUniqueRow(data: MapView[], row_idx: number, sourceIndex: string): number | null {
    for (let i = row_idx; i < data.length; i++) {
      if (sourceIndex !== data[i].sourceIndex) {
        return i;
      }
    }
    return null;
  }

  private setSelectedRow(sourceNavSet: SourceNavSet): void {
    this.selectedRow.next(sourceNavSet);
  }

  /**
   *
   * @param task_id Current Task
   * @param params View filters and sorting
   * @param row_idx Index of row in the view
   */
  loadSourceNav(task: Task, mapping : Mapping | null, params: ViewContext, row_idx: number): void {
    this.setSourceNavigation(task, mapping, row_idx, params, null);
  }

  private findAdjacentSource(task_id: string, params: ViewContext, sourceIndex: string,
                             direction: string, selectedRow: SourceNavSet): void {
    // Map params correctly
    if (task_id) {
      this.mapService.getTaskView(task_id, params.pageIndex, params.pageSize, params.sortColumn, params.sortDir, params.filter)
        .pipe(
          map((result) => {
            const rows = result.content.map(mv => MapView.create(mv as MapView));
            return new Page(rows, result.page.number, result.page.size, result.page.totalElements, result.page.totalPages);
          }),
          map((page: Page) => {
            if (direction === 'PREVIOUS') {
              const prev_row_idx = SourceNavigationService.prevUniqueRow(page.data, page.data.length - 1, sourceIndex);
              if (prev_row_idx === null && page.pageIndex > 0) {
                params.pageIndex = page.pageIndex - 1;
                this.findAdjacentSource(task_id, params, sourceIndex, direction, selectedRow);
              } else if (prev_row_idx !== null) {
                selectedRow.previous = {
                  page,
                  rowIndex: prev_row_idx,
                  params
                };
              }
            } else {
              const next_row_idx = SourceNavigationService.nextUniqueRow(page.data, 0, sourceIndex);
              if (next_row_idx === null && page.pageIndex < page.totalPages) {
                params.pageIndex = page.pageIndex + 1;
                this.findAdjacentSource(task_id, params, sourceIndex, direction, selectedRow);
              } else if (next_row_idx !== null) {
                selectedRow.next = {
                  page,
                  rowIndex: next_row_idx,
                  params
                };
              }
            }
          }),
          catchError((error) => of(error))
        ).subscribe();
    }
  }

  select(task: Task, mapping: Mapping | null, row: MapViewParams): void {
    let rowId = row.page.data[row.rowIndex].rowId;
    this.setSourceNavigation(task, mapping, row.rowIndex, row.params, rowId);
  }

  /**
   * Set navigation for current row
   * Find previous and next rows in current data page and adjacent pages
   *
   * @param row_idx - Index of row in the view (page)
   * @param params - View filters and sorting
   * @param task - Current Task
   * @param page - Page representation of the view
   * @param rowId - null unless for the reconcile task and if called from next / previous
   */
  private setSourceNavigation(task: Task, mapping: Mapping | null, row_idx: number | null, params: ViewContext, rowId: string | null): void {
    if (row_idx !== null) {
      let siblingRow: MapView | null = null;
      // Refresh page.data to avoid bugs with changes to status or noMap
      this.mapService.getTaskView(task.id,
        params.pageIndex, params.pageSize, params.sortColumn, params.sortDir, params.filter)
        .pipe(
          map((result) => {
            const rows = result.content.map(mv => MapView.create(mv as MapView));
            return new Page(rows, result.page.number, result.page.size, result.page.totalElements, result.page.totalPages);
          }),
        ).subscribe((page: Page) => {
        let selectedRow = page.data[row_idx];
        // This code is here because the above "refresh" can result in a smaller amount of rows if rows were
        // removed (e.g. due to a row being reconciled and put into the mapped state)
        if (task.type === TaskType.RECONCILE && rowId && (!selectedRow || selectedRow.rowId !== rowId)) {
          let alternativeRow = page.data.find(row => row.rowId == rowId)
          if (alternativeRow !== undefined) {
            selectedRow = alternativeRow;
          }
        }

        if (mapping !== null && mapping.id && mapping.project.dualMapMode && task.type == TaskType.RECONCILE) {
          // call to get the sibling row as we may not have it (all) in the page of data retrieved
          this.mapService.getSiblingMapViewRow(mapping.id, selectedRow.sourceId, selectedRow.rowId)
          .pipe(
            map((result) => {
              if (result === null) {
                return null;
              }
              return MapView.create(result as MapView);
            }),
          ).subscribe((mapView: MapView | null) => {
            siblingRow = mapView;
            this.configureSourceNaviagation(page, row_idx, selectedRow, siblingRow, task.id, params);
          });
        }
        else {
          this.configureSourceNaviagation(page, row_idx, selectedRow, siblingRow, task.id, params);
        }
      });
    }
  }

  private configureSourceNaviagation(page: Page, row_idx: number, selectedRow: MapView, siblingRow: MapView | null, 
      task_id: string, params: ViewContext) {
    const prev_row_idx = SourceNavigationService.prevUniqueRow(page.data, row_idx - 1, selectedRow.sourceIndex);
    const next_row_idx = SourceNavigationService.nextUniqueRow(page.data, row_idx + 1, selectedRow.sourceIndex);

    const prevParams = {...params};
    const nextParams = {...params};
    const sourceNav: SourceNavSet = {
      mapRow: selectedRow,
      siblingRow: siblingRow,
      current: {
        page,
        rowIndex: row_idx,
        params
      },
      previous: prev_row_idx !== null ? {
        page,
        rowIndex: prev_row_idx,
        params: prevParams
      } : null,
      next: next_row_idx !== null ? {
        page,
        rowIndex: next_row_idx,
        params: nextParams
      } : null
    };

    // Find previous source - may be previous page
    if (prev_row_idx === null && page.pageIndex > 0) {
      prevParams.pageIndex = page.pageIndex - 1;
      this.findAdjacentSource(task_id, prevParams, selectedRow.sourceIndex, 'PREVIOUS', sourceNav);
    }
    // Find next source - may be next page
    if (next_row_idx === null && page.pageIndex < page.totalPages) {
      nextParams.pageIndex = page.pageIndex + 1;
      this.findAdjacentSource(task_id, nextParams, selectedRow.sourceIndex, 'NEXT', sourceNav);
    }

    if (selectedRow) {
      this.setSelectedRow(sourceNav);
    }
  }

}
