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
  Page,
  TARGET_OUT_OF_SCOPE_TAG
} from '../../_models/map_row';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {MatSort, Sort, SortDirection} from '@angular/material/sort';
import {Subscription} from 'rxjs';
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
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent, DialogData, DialogType} from 'src/app/dialog/confirm-dialog/confirm-dialog.component';
import {StatusUtils} from '../../_utils/status_utils';
import {MappingTableSelectorComponent} from '../mapping-table-selector/mapping-table-selector.component';
import {MatTable} from '@angular/material/table';
import {WriteDisableUtils} from '../../_utils/write_disable_utils';
import {FhirService} from "../../_services/fhir.service";
import { MappingNotesComponent } from '../mapping-table-notes/mapping-notes.component';
import { TargetChangedService } from 'src/app/_services/target-changed.service';

export interface TableParams extends Params {
  pageIndex?: number;
  pageSize?: number;
  sortCol?: string;
  sortDirection?: string;
}

export interface TableColumn {
  columnId: string;
  columnDisplay: string;
  displayed: boolean;
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
  @Input() displayedColumns: TableColumn[] = [
  ];
  constantColumns: TableColumn[] = [
    {columnId: 'id', columnDisplay: '', displayed: true},
    {columnId: 'sourceIndex', columnDisplay: 'TABLE.SOURCE_INDEX', displayed: true},
    {columnId: 'sourceCode', columnDisplay: 'TABLE.SOURCE_CODE', displayed: true},
    {columnId: 'sourceDisplay', columnDisplay: 'TABLE.SOURCE_DISPLAY', displayed: true},
    {columnId: 'targetCode', columnDisplay: 'TABLE.TARGET_CODE', displayed: true},
    {columnId: 'targetDisplay', columnDisplay: 'TABLE.TARGET_DISPLAY', displayed: true},
    {columnId: 'relationship', columnDisplay: 'TABLE.RELATIONSHIP', displayed: true},
    {columnId: 'noMap', columnDisplay: 'TABLE.NO_MAP', displayed: true},
    {columnId: 'status', columnDisplay: 'TABLE.STATUS', displayed: true},
    {columnId: 'targetOutOfScope', columnDisplay: 'TABLE.TARGET_OUT_OF_SCOPE', displayed: true},
    {columnId: 'flagged', columnDisplay: 'TABLE.FLAG', displayed: true},
    {columnId: 'latestNote', columnDisplay: 'SOURCE.TABLE.NOTES', displayed: true},
    {columnId: 'lastAuthorReviewer', columnDisplay: 'TABLE.LAST_AUTHOR_REVIEWER', displayed: true},
    {columnId: 'actions', columnDisplay: '', displayed: true}
  ];
  additionalDisplayedColumns: TableColumn[] = [];
  filteredColumns: string[] = [
  ];
  @Input() constantFilteredColumns: string[] = [
    'filter-id',
    'filter-sourceIndex',
    'filter-sourceCode',
    'filter-sourceDisplay',
    'filter-targetCode',
    'filter-targetDisplay',
    'filter-relationship',
    'filter-noMap',
    'filter-status',
    'filter-targetOutOfScope',
    'filter-flagged',
    'filter-notes',
    'filter-lastAuthorReviewer',
    'filter-actions',
  ];
  additionalFilteredColumns: string[] = [];

  @Output() filterChange = new EventEmitter<MapViewFilter>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pagingChange = new EventEmitter<PageEvent>();
  @Output() showDetail = new EventEmitter<number>();
  @Output() showNotes = new EventEmitter<number>();
  @Output() updateTableEvent = new EventEmitter();
  @Output() targetConceptSearchString = new EventEmitter<string>();
  @Output() allSelectedEvent = new EventEmitter<boolean>();

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
  
  allSelected = false;

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

  constructor(private snackBar: MatSnackBar,
              private store: Store<IAppState>,
              private fhirService: FhirService,
              public translate: TranslateService,
              private selectionService: SelectionService,
              private mapService: MapService,
              public dialog: MatDialog,
              private targetChangedService: TargetChangedService) {
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

        this.additionalDisplayedColumns = [];
        this.additionalFilteredColumns = [];
        if (this.page.additionalColumns) {
          for (let i = 0; i <  this.page.additionalColumns.length; i++) {
            this.additionalDisplayedColumns.push({columnId: "additionalColumn" + (i+1), columnDisplay:  this.page.additionalColumns[i].name, displayed: true});
            this.additionalFilteredColumns.push("filter-additionalColumn" + (i+1));
          }
        }
    
        // display additional columns at the end of the table
        // this.displayedColumns = this.constantColumns.concat(this.additionalDisplayedColumns);
        // this.filteredColumns = this.constantFilteredColumns.concat(this.additionalFilteredColumns);

        // display additional columns after source columns
        this.displayedColumns = this.constantColumns.slice(0,4).concat(this.additionalDisplayedColumns).concat(this.constantColumns.slice(4));
        this.filteredColumns = this.constantFilteredColumns.slice(0,4).concat(this.additionalFilteredColumns).concat(this.constantFilteredColumns.slice(4));

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

    this.additionalDisplayedColumns = [];
    this.additionalFilteredColumns = [];

    if (this.paging.sortCol) {
      this.sort.active = this.paging.sortCol;
    }
    if (this.paging.sortDirection) {
      this.sort.direction = this.paging.sortDirection as SortDirection;
    }
    this.sort.sortChange.emit();  // Work-around to initialise view

    this.sort.sortChange.subscribe((event) => this.sortChange.emit(event));
    this.paginator.page.subscribe((event) => this.pagingChange.emit(event));

  }

  getDataListId(index : number) {
    return "no_additional_column_display" + index;
  }

  clickSourceDisplay(row: MapView): void {
    this.targetConceptSearchString.emit(row.sourceDisplay);
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

  getDisplayedColumns() : string[] {
    return this.displayedColumns?.filter(obj => obj.displayed === true).map((obj) => obj.columnId);
  }

  isFilterColumnVisible(filterId : string) : boolean {

    let visible = true;
    let foundColumn = this.displayedColumns.find(column => column.columnId === filterId.substring("filter-".length));
    if (foundColumn) {
      visible = foundColumn.displayed;
    }

    return visible; 
  }

  dismiss(): void {
    this.snackBar.dismiss();
  }

  updateNoMapRow($event: any, index: number): void {
    const self = this;
    const mapView: MapView = self.page?.data[index] as MapView;
    if (mapView) {
      if (($event.checked && mapView.targetCode && mapView.targetCode !== '') || ($event.checked && self.task!.type == TaskType.RECONCILE)) {
        // when noMap ON - remove any targets - confirm
        const confirmDialogRef = self.dialog.open(ConfirmDialogComponent,
          {data: self.getNomapConfirmDialogData()});
        confirmDialogRef.afterClosed().subscribe(
          (ok) => {
            if (ok) {
              self.mapService.updateNoMap(mapView.rowId, mapView.noMap, this.task!.type === TaskType.RECONCILE).subscribe((res) => {
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
        self.mapService.updateNoMap(mapView.rowId, mapView.noMap, this.task!.type === TaskType.RECONCILE).subscribe((res) => {
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
      if (mapView.hasTargetOrRelationshipChanged() && !(self.task!.type == TaskType.RECONCILE)) {
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
    const [result, targetRow] = self.mapService.updateMapRowTarget(mapView, self.task!.type);
    result.subscribe(
      (result) => {
        mapView.updateFromTarget(result);
        self.mapService.updateStatus(mapView.rowId, mapView.status as MapRowStatus).subscribe((saved) => {
          mapView.updateStatus(saved.status);
          self.updateTableEvent.emit();
        });
        this.targetChangedService.changeTarget(targetRow);
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
      self.mapService.findTargetsBySourceIndex(self.task.mapping.id, row.sourceIndex, undefined)
      .subscribe(rows => {
        const matchingTargetCodes = rows._embedded.mapRowTargets.filter(target => target.targetCode==event.data?.code);
        if ((this.task?.mapping.project.dualMapMode && matchingTargetCodes.length > 1) || 
            (!this.task?.mapping.project.dualMapMode && matchingTargetCodes.length > 0)) {
          self.dialog.open(ConfirmDialogComponent, {data: self.getDuplicateTargetDialogData()});
        } else {
          self.fhirService.getEnglishFsn(event.data?.code, event.data?.system, self.task?.mapping?.toVersion || '').subscribe(englishFsn => {
            let displayTerm = event.data?.display;
            if (englishFsn !== '') {
              displayTerm = englishFsn;
            }

            row.targetCode = event.data?.code;
            row.targetDisplay = displayTerm;
            if (this.task!.type !== TaskType.RECONCILE) {
              row.status = MapRowStatus.DRAFT;
            }
            row.relationship = MapRowRelationship.INEXACT;
            row.targetOutOfScope = false;

            const tagIndex = row.tags?.indexOf(TARGET_OUT_OF_SCOPE_TAG, 0);
            if (tagIndex !== undefined && tagIndex > -1) {
              row.tags?.splice(tagIndex, 1);
            }
            
            self.updateMapRowTarget(row, index);
          });
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

  notesView(row_idx: number, mapRow: MapView): void {

    this.dialog.open(MappingNotesComponent, {
      width: '800px', 
      data: {
        rowId: mapRow.rowId,
        sourceCode: mapRow.sourceCode,
        sourceDisplay: mapRow.sourceDisplay
      }
    });

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

    onAllSelected(allSelected: boolean) {
    this.allSelected = allSelected
    this.allSelectedEvent.emit(allSelected);
  }

}
