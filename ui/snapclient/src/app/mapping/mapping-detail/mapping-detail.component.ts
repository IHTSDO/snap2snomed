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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {IAppState} from '../../store/app.state';
import {TranslateService} from '@ngx-translate/core';
import {Task, TaskType} from '../../_models/task';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {MapService} from '../../_services/map.service';
import {
  authorStatuses,
  MapRow,
  MapRowStatus,
  mapRowStatusToIconName,
  MapView,
  MapViewFilter,
  toMapRowStatus
} from '../../_models/map_row';
import {TargetRow} from '../../_models/target_row';
import {MatDialog} from '@angular/material/dialog';
import {ServiceUtils} from '../../_utils/service_utils';
import {ConfirmDialogComponent, DialogType} from '../../dialog/confirm-dialog/confirm-dialog.component';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {TableParams} from '../mapping-table/mapping-table.component';
import {selectCurrentView} from 'src/app/store/mapping-feature/mapping.selectors';
import {SourceNavigationService, SourceNavSet} from 'src/app/_services/source-navigation.service';
import {Subscription} from 'rxjs';
import {ViewContext} from 'src/app/store/mapping-feature/mapping.actions';
import {ConceptNode} from '@csiro/shrimp-hierarchy-view';
import {SelectionService} from 'src/app/_services/selection.service';
import {Coding} from '../../store/fhir-feature/fhir.reducer';
import {selectConceptHierarcy} from 'src/app/store/fhir-feature/fhir.selectors';
import {ConceptHierarchy} from 'src/app/store/fhir-feature/fhir.actions';
import {StatusUtils} from '../../_utils/status_utils';
import {WriteDisableUtils} from "../../_utils/write_disable_utils";
import {debounceTime} from "rxjs/operators";


export type SourceRow = {
  id: string;
  code: string;
  display: string;
  index: string;
  noMap: boolean;
  status: string;
};

@Component({
  selector: 'app-mapping-detail',
  templateUrl: './mapping-detail.component.html',
  styleUrls: ['./mapping-detail.component.css']
})
export class MappingDetailComponent implements OnInit, OnDestroy {

  private subscription = new Subscription();
  private selectedRowset: SourceNavSet | null = null;
  source!: SourceRow;
  nodes: ConceptNode<Coding>[] = [];
  loadingHierarchy = false;
  private timeout: NodeJS.Timeout | null = null;
  hierarchyView = 'tree';
  mapRows: MapView[] = [];
  rowId: string | null = null;
  error: ErrorInfo = {};
  loading = false;
  // dialog
  savedOK = '';
  cancel = '';
  confirmTitle = '';
  confirmMessage = '';
  appliedFilters: string[] = [];
  toIconName = mapRowStatusToIconName;
  toMapRowStatus = toMapRowStatus;
  writeDisableUtils = WriteDisableUtils;

  currentSelection: any;

  @Input() task: Task | undefined;
  @Input() paging!: TableParams;
  @Input() filterEntity!: MapViewFilter;
  @Output() detailClose = new EventEmitter<boolean>();

  constructor(private store: Store<IAppState>,
              private translate: TranslateService,
              private selectionService: SelectionService,
              private mapService: MapService,
              private sourceNavigation: SourceNavigationService,
              public dialog: MatDialog) {
    this.translate.get('DIALOG.OK').subscribe((msg) => this.savedOK = msg);
    this.translate.get('DIALOG.CANCEL').subscribe((msg) => this.cancel = msg);
    this.translate.get('DIALOG.TITLE_CONFIRM').subscribe((msg) => this.confirmTitle = msg);
    this.translate.get('DIALOG.CONFIRM_NO_MAP').subscribe((msg) => this.confirmMessage = msg);
  }

  ngOnInit(): void {
    const self = this;

    const view = localStorage.getItem('hierarchyView');
    if (null === view) {
      localStorage.setItem('hierarchyView', self.hierarchyView);
    } else {
      self.hierarchyView = view;
    }

    self.store.select(selectCurrentView).subscribe((page) => {
      self.loadTargets();
    });

    self.subscription.add(self.sourceNavigation.selectedRow$.subscribe((selected) => {
      if (selected && selected?.mapRow && self.task) {
        self.selectedRowset = selected;
        self.source = {
          id: selected.mapRow.rowId,
          code: selected.mapRow.sourceCode,
          display: selected.mapRow.sourceDisplay,
          index: selected.mapRow.sourceIndex,
          noMap: selected.mapRow.noMap,
          status: selected.mapRow.status
        };
        self.loadTargets();
      }
    }));

    self.subscription.add(self.store.select(selectConceptHierarcy).subscribe((nodes) => {
      if (self.selectedRowset?.current) {
        self.clearLoading();
        self.nodes = nodes;
      }
    }));

    self.subscription.add(self.selectionService.subscribeWithCurrent({
      next(selection: any): void {
        self.currentSelection = selection;
        self.handleSelection();
      },
      error(error): void {
        console.error('Selection error', error);
      }
    }));
  }

  private handleSelection(): void {
    const self = this;
    const selection = self.currentSelection;

    if (self.selectedRowset?.current && selection?.code) {
      self.setLoading();
      self.store.dispatch(new ConceptHierarchy({
        code: selection.code,
        system: selection.system,
        version: selection.version ?? self.task?.mapping?.toVersion,
      }));
    }
  }

  toggleHierarchy(): void {
    this.hierarchyView = this.hierarchyView === 'tree' ? 'shrimp' : 'tree';
    localStorage.setItem('hierarchyView', this.hierarchyView);
    this.handleSelection();
  }

  private setLoading(): void {
    // in case search is taking some time, display spinner
    this.timeout = setTimeout(() => {
      if (this.timeout) {
        this.loadingHierarchy = true;
      }
    }, 500);
  }

  private clearLoading(): void {
    if (this.timeout) {
      const timeout = this.timeout;
      this.timeout = null;
      clearTimeout(timeout);
    }
    this.loadingHierarchy = false;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onSelected(node: Coding): void {
    this.selectionService.select(node);
  }

  private updateChips(): void {
    const self = this;

    if (self.filterEntity) {
      self.appliedFilters = [];

      if (self.filterEntity.noMap !== undefined) {
        self.appliedFilters.push('FILTERCHIP.noMap=' + self.filterEntity.noMap);
      }
      if (self.filterEntity.flagged !== undefined) {
        self.appliedFilters.push('FILTERCHIP.flagged=' + self.filterEntity.flagged);
      }
      if (Array.isArray(self.filterEntity.relationship)) {
        self.filterEntity.relationship.forEach(r => {
          self.appliedFilters.push('RELATIONSHIP.' + r);
        });
      }
      if (Array.isArray(self.filterEntity.status)) {
        self.filterEntity.status.forEach(s => {
          self.appliedFilters.push('STATUS.' + s);
        });
      }

      if (self.filterEntity.sourceCode) {
        self.appliedFilters.push(self.filterEntity.sourceCode);
      }
      if (self.filterEntity.sourceDisplay) {
        self.appliedFilters.push(self.filterEntity.sourceDisplay);
      }
      if (self.filterEntity.targetCode) {
        self.appliedFilters.push(self.filterEntity.targetCode);
      }
      if (self.filterEntity.targetDisplay) {
        self.appliedFilters.push(self.filterEntity.targetDisplay);
      }

    }
  }

  private getContext(): ViewContext {
    return {
      pageIndex: this.paging.pageIndex ?? 0,
      pageSize: this.paging.pageSize ?? 20,
      sortColumn: this.paging.sortCol,
      sortDir: this.paging.sortDirection,
      filter: ServiceUtils.filtersToParam(this.filterEntity),
    };
  }

  backToTask(): void {
    this.clearLoading();
    this.nodes = [];
    this.detailClose.emit(true);
  }

  private loadTargets(): void {
    const self = this;

    if (self.task?.mapping?.id && self.source) {
      self.rowId = self.source.id ?? null;
      // self.noMap = self.source.noMap;
      self.mapService.findTargetsBySourceIndex(self.task.mapping.id, self.source.index).pipe(debounceTime(200)).subscribe((rows) => {
        const source = self.source;
        if (source && !source.noMap && rows._embedded.mapRowTargets.length > 0) {
          self.mapRows = rows._embedded.mapRowTargets.map((target) => {
            const status = target.row?.status ?? MapRowStatus.UNMAPPED;
            const flagged = target.row?.id ? target.flagged : undefined;
            return new MapView(target.row?.id || '', target.id, source.index || '', source.code || '',
              source.display || '', target.targetCode, target.targetDisplay, target.relationship, status,
              false, target.row?.latestNote || null, null, null, null,
              null, flagged);
          });
        } else {
          self.mapRows = [];
        }
      });
      self.updateChips();
    }
  }

  saveTarget($event: MapView): void {
    const self = this;
    $event.rowId = self.rowId ?? '';
    const mapView = $event;
    if (mapView.targetId === '' || mapView.hasChanged()) {
      const targetRow = new TargetRow(
        mapView.rowId,
        mapView.targetId, mapView.targetCode, mapView.targetDisplay,
        mapView.relationship, mapView.flagged);
      this.mapService.createTarget(targetRow).subscribe((result) => {
          const targetId = ServiceUtils.extractIdFromHref(result._links.self.href, null);
          mapView.updateNoMap(mapView.noMap);
          mapView.targetId = targetId;
          self.loadTargets();
          self.updateSelectedRowSet(true);
          self.updateStatus(mapView.status as MapRowStatus);
        },
        (err) => this.translate.get('ERROR.TARGETS_NOT_SAVED').subscribe((msg) => {
          this.error.message = msg;
        })
      );
    }
  }

  removeTarget($event: MapView): void {
    const self = this;
    const mapView = $event;
    if (mapView.targetId && mapView.targetId !== '') {
      this.mapService.deleteTarget(mapView.targetId).subscribe((result) => {
          self.mapRows = self.mapRows.map((r) => r).filter((row) => row !== mapView);
          self.updateSelectedRowSet(false);
          if (self.mapRows.length <= 0) {
            self.updateStatus(MapRowStatus.UNMAPPED);
          } else {
            self.updateStatus(MapRowStatus.DRAFT);
          }
        },
        (err) => this.translate.get('ERROR.TARGETS_NOT_DELETED').subscribe((msg) => {
          this.error.message = msg;
        })
      );
    }
  }

  updateNoMap($event: MatCheckboxChange): void {
    const self = this;
    const cbNoMap = $event.checked;
    // No Map set to true with existing rows
    if (cbNoMap && self.mapRows.length > 0) {
      const confirmDialogRef = self.dialog.open(ConfirmDialogComponent, {
        data: {
          title: self.confirmTitle,
          message: self.confirmMessage,
          button: self.savedOK,
          cancel: self.cancel,
          type: DialogType.CONFIRM
        }
      });
      confirmDialogRef.afterClosed().subscribe(
        (ok) => {
          if (ok) {
            if (self.rowId) {
              // remove any saved targets - will be deleted by API when No Map set to true
              self.mapService.updateNoMap(self.rowId, cbNoMap).subscribe((result) => {
                self.source.noMap = cbNoMap;
                self.mapRows = [];
                self.source.status = result.status;
                if (self.task && self.selectedRowset?.current && self.selectedRowset?.mapRow) {
                  self.selectedRowset.mapRow.updateFromRow(result as MapRow);
                }
              });
            } else {
              self.translate.get('ERROR.NO_MAP_NOT_SAVED').subscribe((msg) => {
                self.error.message = msg;
              });
            }
          } else {
            $event.source.checked = false;
            self.source.noMap = false;
          }
        });
    } else if (self.rowId) {
      self.mapService.updateNoMap(self.rowId, cbNoMap).subscribe((result) => {
        self.source.noMap = cbNoMap;
        self.source.status = result.status;
        if (self.selectedRowset?.mapRow) {
          self.selectedRowset.mapRow.updateFromRow(result as MapRow);
        }
      });
    } else {
      self.translate.get('ERROR.NO_MAP_NOT_SAVED').subscribe((msg) => {
        self.error.message = msg;
      });
    }
  }

  loadPrevious(): void {
    const self = this;
    if (self.task && self.selectedRowset?.previous) {
      self.sourceNavigation.select(self.task.id, self.selectedRowset?.previous);
    }
  }

  loadNext(): void {
    const self = this;
    if (self.task && self.selectedRowset?.next) {
      self.sourceNavigation.select(self.task.id, self.selectedRowset?.next);
    }
  }

  hasPrevious(): boolean {
    return !!this.selectedRowset?.previous;
  }

  hasNext(): boolean {
    return !!this.selectedRowset?.next;
  }

  updateSelectedRowSet(add: Boolean): void {
    const self = this;
    if (self && self.task && self.selectedRowset && self.selectedRowset.current) {
      // update selectedRowset to maintain functionality of nav buttons
      const current = self.selectedRowset.current;
      const data = current.page.data;
      const context = self.getContext();
      let firstIndex: number;
      let pageIndex: number;
      let previousPageRowIndex = self.selectedRowset.previous?.page.data.findIndex((el) => el.sourceCode === data[current.rowIndex].sourceCode);
      let previousPageIndex = self.selectedRowset.previous?.page.pageIndex;

      const removingFirstEntryOnPage = current.rowIndex === 0 && !add;

      if (removingFirstEntryOnPage && previousPageIndex === current.page.pageIndex - 1 && previousPageRowIndex && previousPageRowIndex !== -1) {
        // when removing an item that has targets spanning multiple pages,
        // try to set current page and index back to first source on previous page
        firstIndex = previousPageRowIndex;
        pageIndex = previousPageIndex;
      }
      else if (removingFirstEntryOnPage && previousPageIndex !== current.page.pageIndex - 1) {
        // when previous page doesn't contain the source and is not adjacent to current page,
        // reset firstIndex and set pageIndex to be one less than current page
        // to prevent removal of item jumping to next source on current page.
        firstIndex = 0;
        pageIndex = current.page.pageIndex - 1;
      }
      else {
        firstIndex = data.findIndex((el) => el.sourceCode === data[current.rowIndex].sourceCode);
        pageIndex = current.page.pageIndex;
      }

      context.pageIndex = pageIndex;
      self.sourceNavigation.loadSourceNav(self.task.id, context, firstIndex);
    }
  }

  updateStatus($event: MapRowStatus): void {
    const self = this;
    if (self.rowId && $event) {
      self.mapService.updateStatus(self.rowId, $event).subscribe((result) => {
          self.source.status = result.status;
          if (self.task && self.selectedRowset?.current && self.selectedRowset?.mapRow) {
            self.selectedRowset.mapRow.updateFromRow(result as MapRow);
          }
        },
        (error) => this.translate.get('ERROR.TARGET_NOT_UPDATED').subscribe((msg) => {
          this.error.message = msg;
        })
      );
    }
  }

  updateFlag($event: MapView): void {
    const self = this;
    if ($event && $event.targetId && $event.flagged !== undefined) {
      self.mapService.updateFlag($event.targetId, $event.flagged).subscribe();
    }
  }

  getStatusList(): MapRowStatus[] {
    const self = this;
    return self.task && self.source.status ?
      StatusUtils.getAvailableStatusOptions(self.task.type as TaskType, self.source.status as MapRowStatus) : [];
  }

  getSource(): SourceRow {
    return this.source;
  }
}
