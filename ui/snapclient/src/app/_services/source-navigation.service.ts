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

interface MapViewParams {
  page: Page;
  rowIndex: number;
  params: ViewContext;
}

export interface SourceNavSet {
  mapRow: MapView | null;
  current: MapViewParams | null;
  previous: MapViewParams | null;
  next: MapViewParams | null;
}

export const initialSourceNav: SourceNavSet = {
  mapRow: null,
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
  loadSourceNav(task_id: string, params: ViewContext, row_idx: number): void {
    this.setSourceNavigation(task_id, row_idx, params);
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

  select(task_id: string, row: MapViewParams): void {
    this.setSourceNavigation(task_id, row.rowIndex, row.params);
  }

  /**
   * Set navigation for current row
   * Find previous and next rows in current data page and adjacent pages
   *
   * @param row_idx - Index of row in the view (page)
   * @param params - View filters and sorting
   * @param task - Current Task
   * @param page - Page representation of the view
   */
  private setSourceNavigation(task_id: string, row_idx: number | null, params: ViewContext): void {
    if (row_idx !== null) {
      // Refresh page.data to avoid bugs with changes to status or noMap
      this.mapService.getTaskView(task_id,
        params.pageIndex, params.pageSize, params.sortColumn, params.sortDir, params.filter)
        .pipe(
          map((result) => {
            const rows = result.content.map(mv => MapView.create(mv as MapView));
            return new Page(rows, result.page.number, result.page.size, result.page.totalElements, result.page.totalPages);
          }),
        ).subscribe((page: Page) => {
        const selectedRow = page.data[row_idx];
        const prev_row_idx = SourceNavigationService.prevUniqueRow(page.data, row_idx - 1, selectedRow.sourceIndex);
        const next_row_idx = SourceNavigationService.nextUniqueRow(page.data, row_idx + 1, selectedRow.sourceIndex);

        const prevParams = {...params};
        const nextParams = {...params};
        const sourceNav: SourceNavSet = {
          mapRow: selectedRow,
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
      });
    }
  }

}
