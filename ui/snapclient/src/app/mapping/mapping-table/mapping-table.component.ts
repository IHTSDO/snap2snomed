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

import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {MapService} from '../../_services/map.service';
import {
  MappedRowDetailsDto,
  MapRowRelationship,
  mapRowRelationships,
  MapRowStatus,
  mapRowStatuses,
  MapView,
  MapViewFilter,
  Page
} from '../../_models/map_row';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {MatSort, Sort, SortDirection} from '@angular/material/sort';
import {Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {IAppState} from '../../store/app.state';
import {Task, TaskType} from '../../_models/task';
import {selectCurrentView} from '../../store/mapping-feature/mapping.selectors';
import {Mapping} from '../../_models/mapping';
import {DroppableEventObject} from 'src/app/_directives/droppable.directive';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTableFilter} from 'mat-table-filter';
import {ErrorInfo} from 'src/app/errormessage/errormessage.component';
import {Params} from '@angular/router';
import {ServiceUtils} from '../../_utils/service_utils';
import {SelectionService} from 'src/app/_services/selection.service';
import {FormControl} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent, DialogData, DialogType} from 'src/app/dialog/confirm-dialog/confirm-dialog.component';
import {StatusUtils} from '../../_utils/status_utils';
import {MappingTableSelectorComponent} from '../mapping-table-selector/mapping-table-selector.component';
import {MatTable} from '@angular/material/table';
import {WriteDisableUtils} from '../../_utils/write_disable_utils';

export interface TableParams extends Params {
  pageIndex?: number;
  pageSize?: number;
  sortCol?: string;
  sortDirection?: string;
}

@Component({
  selector: 'app-mapping-table',
  templateUrl: './mapping-table.component.html',
  styleUrls: ['./mapping-table.component.css']
})
export class MappingTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() paging!: TableParams;
  @Input() filterEntity!: MapViewFilter;
  @Input() task!: Task;
  @Input() isOwner!: boolean;

  /** Columns displayed in the table - specified in html. Columns IDs can be added, removed, or reordered. */
  @Input() displayedColumns: string[] = [
    'id',
    'sourceIndex',
    'sourceCode',
    'sourceDisplay',
    'targetCode',
    'targetDisplay',
    'relationship',
    'noMap',
    'status',
    'flagged',
    'latestNote',
    'actions'
  ];
  @Input() filteredColumns: string[] = [
    'filter-id',
    'filter-source-index',
    'filter-source-code',
    'filter-source-display',
    'filter-target-code',
    'filter-target-display',
    'filter-relationship',
    'filter-noMap',
    'filter-status',
    'filter-flagged'
  ];

  @Output() filterChange = new EventEmitter<MapViewFilter>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pagingChange = new EventEmitter<PageEvent>();
  @Output() showDetail = new EventEmitter<number>();
  @Output() updateTableEvent = new EventEmitter();

  mappingTableSelector: MappingTableSelectorComponent | null | undefined;

  // @ts-ignore
  @ViewChild('snackBarTemplate') snackBarTemplate: TemplateRef<any>;
  // @ts-ignore
  @ViewChild(MatTable) table: MatTable<any>;
  // @ts-ignore
  @ViewChild(MatPaginator) paginator: MatPaginator;
  // @ts-ignore
  @ViewChild(MatSort) sort: MatSort;
  // @ts-ignore
  @ViewChild(MappingTableSelectorComponent, {static: false})
  set concent(selector: MappingTableSelectorComponent) {
    this.mappingTableSelector = selector;
  }

  page: Page = new Page();
  allSourceDetails: MappedRowDetailsDto[] = [];
  writeDisableUtils = WriteDisableUtils;

  private subscription = new Subscription();
  private debounce = 200;

  // tslint:disable-next-line:variable-name
  private _filterEnabled = false;
  @Input() set filterEnabled(value: boolean) {
    if (this._filterEnabled && !value) {
      this.clearFilter();
    }
    this._filterEnabled = value;
  }

  get filterEnabled(): boolean {
    return this._filterEnabled;
  }

  private mapping: Mapping | null | undefined;

  filterType: MatTableFilter;
  statuses: MapRowStatus[];
  relationships: MapRowRelationship[];
  yesNoOptions: [string, boolean][];
  error: ErrorInfo = {};

  private clickedRow?: number;

  sourceCodeFilterControl = new FormControl('');
  sourceDisplayFilterControl = new FormControl('');
  targetCodeFilterControl = new FormControl('');
  targetDisplayFilterControl = new FormControl('');

  constructor(private snackBar: MatSnackBar,
              private store: Store<IAppState>,
              public translate: TranslateService,
              private selectionService: SelectionService,
              private mapService: MapService,
              public dialog: MatDialog) {
    const initialSelection: MapView[] = [];
    const allowMultiSelect = true;
    const emitChanges = true;

    this.paging = {};
    this.filterEntity = new MapViewFilter();
    this.filterType = MatTableFilter.ANYWHERE;
    this.relationships = mapRowRelationships;
    this.statuses = mapRowStatuses;
    this.yesNoOptions = [
      ['NO_MAP_TRUE', true],
      ['NO_MAP_FALSE', false]
    ];
  }

  ngOnInit(): void {
    const self = this;
    this.subscription.add(this.store.select(selectCurrentView).subscribe(
      (page) => {
        this.page = page ?? new Page();
        if (page?.sourceDetails) {
          self.allSourceDetails = page.sourceDetails;
        }
      })
    );
    this.subscription.add(
      this.selectionService.subscribe({
        // tslint:disable-next-line:variable-name
        next: (_value: any) => {
          this.clickedRow = undefined;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    if (this.paging.sortCol) {
      this.sort.active = this.paging.sortCol;
    }
    if (this.paging.sortDirection) {
      this.sort.direction = this.paging.sortDirection as SortDirection;
    }
    this.sort.sortChange.emit();  // Work-around to initialise view

    this.sort.sortChange.subscribe((event) => this.sortChange.emit(event));
    this.paginator.page.subscribe((event) => this.pagingChange.emit(event));

    // search as you type
    [this.sourceCodeFilterControl, this.sourceDisplayFilterControl,
      this.targetCodeFilterControl, this.targetDisplayFilterControl].forEach((control) => {
      this.subscription.add(control.valueChanges
        .pipe(debounceTime(this.debounce), distinctUntilChanged())
        .subscribe(() => {
          this.filterUpdate();
        }));
    });
  }

  clickRow(idx: number, row: MapView): void {
    if (this.clickedRow === idx) {
      this.selectionService.select(null);
      this.clickedRow = undefined;
    } else {
      const m = this.getMapping();
      this.selectionService.select({
        code: row.targetCode,
        display: row.targetDisplay,
        system: m?.toSystem ?? 'http://snomed.info/sct',
        version: m?.toVersion,
      });
      this.clickedRow = idx;
    }
  }

  isClicked(idx: number): boolean {
    return idx === this.clickedRow;
  }

  getMapping(): Mapping | undefined {
    return this.mapping ?? undefined;
  }

  dismiss(): void {
    this.snackBar.dismiss();
  }

  updateNoMapRow($event: any, index: number): void {
    const self = this;
    const mapView: MapView = self.page?.data[index] as MapView;
    if (mapView) {
      if ($event.checked && mapView.targetCode && mapView.targetCode !== '') {
        // when noMap ON - remove any targets - confirm
        const confirmDialogRef = self.dialog.open(ConfirmDialogComponent,
          {data: self.getNomapConfirmDialogData()});
        confirmDialogRef.afterClosed().subscribe(
          (ok) => {
            if (ok) {
              self.mapService.updateNoMap(mapView.rowId, mapView.noMap).subscribe((res) => {
                mapView.updateFromRow(res);
                self.updateTableEvent.emit();
              });
            } else {
              // No changes (reset)
              $event.source.checked = false;
              mapView.noMap = false;
            }
          },
          (error) => {
            // reset and show error
            $event.source.checked = false;
            mapView.noMap = false;
            this.handleUpdateError(error, mapView);
          });

      } else {
        self.mapService.updateNoMap(mapView.rowId, mapView.noMap).subscribe((res) => {
          mapView.updateFromRow(res);
          self.updateTableEvent.emit();
        });
      }
    }
  }

  updateMapRow($event: MapView, index: number): void {
    const self = this;
    const mapView: MapView = $event ? $event as MapView : self.page?.data[index] as MapView;
    if (mapView) {
      self.mapService.updateMapRow(mapView.rowId, mapView).subscribe(
        (result) => {
          mapView.updateFromRow(result);
          self.updateTableEvent.emit();
        },
        (error) => {
          mapView.reset();
          this.handleUpdateError(error, mapView);
        });
    }
  }

  handleUpdateError(error: any, mapView: MapView): void {
    if (error?.error) {
      this.translate.get('ERROR.UPDATE_ERROR').subscribe(res => {
        this.error.message = res;
        this.error.detail = error?.error;
        this.snackBar.openFromTemplate(this.snackBarTemplate, {
          panelClass: ['mat-toolbar', 'mat-primary'],
        });
      });
    } else {
      this.error.message = error;
    }
  }

  updateMapRowTarget($event: MapView, index: number): void {
    const self = this;
    const mapView: MapView = $event ? $event as MapView : self.page?.data[index] as MapView;
    if (mapView) {
      if (mapView.hasTargetOrRelationshipChanged()) {
        mapView.status = MapRowStatus.DRAFT;
      }
      this.doMapRowTargetUodate(self, mapView);
    }
  }

  updateFlag(mapView: MapView): void {
    const self = this;
    if (mapView.targetId) {
      mapView.flagged = !mapView.flagged;
      this.doMapRowTargetUodate(self, mapView);
    }
  }

  private doMapRowTargetUodate(self: this, mapView: MapView): void {
    self.mapService.updateMapRowTarget(mapView).subscribe(
      (result) => {
        mapView.updateFromTarget(result);
        self.mapService.updateStatus(mapView.rowId, mapView.status as MapRowStatus).subscribe((saved) => {
          mapView.updateStatus(saved.status);
          self.updateTableEvent.emit();
        });
      },
      (error) => {
        mapView.reset();
        this.handleUpdateError(error, mapView);
      });
  }

  onDrop(event: DroppableEventObject, index: number): void {
    const self = this;
    const row = self.page?.data[index];
    if (row && self.task.mapping.id) {
      self.mapService.findTargetsBySourceIndex(self.task.mapping.id, row.sourceIndex)
      .subscribe(rows => {
        const targetCodes = rows._embedded.mapRowTargets.map(target => target.targetCode);
        if (targetCodes.includes(event.data?.code)) {
          self.dialog.open(ConfirmDialogComponent, {data: self.getDuplicateTargetDialogData()});
        } else {
          row.targetCode = event.data?.code;
          row.targetDisplay = event.data?.display;
          row.status = MapRowStatus.DRAFT;
          row.relationship = MapRowRelationship.INEXACT;
          self.updateMapRowTarget(row, index);
        }
      });
    }
  }

  explainRelationship(relationship: string | null): string {
    return ServiceUtils.explainRelationship(this.translate, relationship);
  }

  filterUpdate(): void {
    this.paging.pageIndex = 0;
    this.mappingTableSelector?.clearAllSelectedRows();
    this.filterRows();
  }

  filterRows(): void {
    this.filterChange.emit(this.filterEntity);
  }

  clearFilter(): void {
    this.mappingTableSelector?.clearAllSelectedRows();
    this.filterEntity = new MapViewFilter();
    this.filterUpdate();
  }

  detailsView(row_idx: number): void {
    this.showDetail.emit(row_idx);
  }

  getDuplicateTargetDialogData(): DialogData {
    let savedOK = '';
    let confirmTitle = '';
    let confirmMessage = '';
    this.translate.get('DIALOG.OK').subscribe((msg) => savedOK = msg);
    this.translate.get('DIALOG.TITLE_CONFIRM').subscribe((msg) => confirmTitle = msg);
    this.translate.get('ERROR.DUPLICATE_TARGET_ERROR').subscribe((msg) => confirmMessage = msg);
    return {
      title: confirmTitle,
      message: confirmMessage,
      button: savedOK,
      type: DialogType.CONFIRM
    };
  }

  getNomapConfirmDialogData(): DialogData {
    let savedOK = '';
    let cancel = '';
    let confirmTitle = '';
    let confirmMessage = '';
    this.translate.get('DIALOG.OK').subscribe((msg) => savedOK = msg);
    this.translate.get('DIALOG.CANCEL').subscribe((msg) => cancel = msg);
    this.translate.get('DIALOG.TITLE_CONFIRM').subscribe((msg) => confirmTitle = msg);
    this.translate.get('DIALOG.CONFIRM_NO_MAP').subscribe((msg) => confirmMessage = msg);
    return {
      title: confirmTitle,
      message: confirmMessage,
      button: savedOK,
      cancel,
      type: DialogType.CONFIRM
    };
  }

  isStatusDisabled(mapView: MapView, statusOption: MapRowStatus): boolean {
    return this.task ? StatusUtils.isStatusOptionDisabled(this.task.type, mapView, statusOption) : false;
  }

  hasTarget(maprow: MapView): boolean {
    return !!(maprow.targetId && maprow.targetId !== '' && !maprow.noMap);
  }

  getStatuses(mapRow: MapView): MapRowStatus[] {
    return this.task ? StatusUtils.getAvailableStatusOptions(this.task.type as TaskType, mapRow.status as MapRowStatus) : mapRowStatuses;
  }

}
