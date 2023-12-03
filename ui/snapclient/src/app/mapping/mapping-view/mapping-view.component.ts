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

import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Mapping} from '../../_models/mapping';
import {ActivatedRoute, Router} from '@angular/router';
import {IAppState} from '../../store/app.state';
import {Store} from '@ngrx/store';
import {
  selectCurrentMapping,
  selectCurrentView,
  selectMappingLoading
} from '../../store/mapping-feature/mapping.selectors';
import {MatTable} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {
  MappedRowDetailsDto,
  MapRowRelationship,
  mapRowRelationships,
  MapRowStatus,
  mapRowStatuses,
  MapView,
  MapViewFilter,
  MapViewPaging,
  Page
} from '../../_models/map_row';
import {TranslateService} from '@ngx-translate/core';
import {MapService} from '../../_services/map.service';
import {debounceTime, startWith, tap} from 'rxjs/operators';
import {merge, Subscription} from 'rxjs';
import {MatSort} from '@angular/material/sort';
import {Task, TaskType} from '../../_models/task';
import {LoadTasksForMap} from '../../store/task-feature/task.actions';
import {saveAs} from 'file-saver';
import {User} from '../../_models/user';
import {selectTaskList} from '../../store/task-feature/task.selectors';
import {AssignedWorkComponent} from '../../task/assigned-work/assigned-work.component';
import {MatTableFilter} from 'mat-table-filter';
import {HttpParams} from '@angular/common/http';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {ServiceUtils} from '../../_utils/service_utils';
import {LoadMapping, LoadMapView, ViewContext} from 'src/app/store/mapping-feature/mapping.actions';
import {BulkchangeComponent, BulkChangeDialogData, getResultMessage} from '../bulkchange/bulkchange.component';
import {MatDialog} from '@angular/material/dialog';
import {MatBottomSheet, MatBottomSheetConfig} from '@angular/material/bottom-sheet';
import {ResultsdialogComponent} from 'src/app/resultsdialog/resultsdialog.component';
import {MappingTableSelectorComponent} from '../mapping-table-selector/mapping-table-selector.component';
import {selectMappingFile, selectMappingFileError, selectMappingFileLoading, selectMappingFileSuccess} from 'src/app/store/source-feature/source.selectors';
import {ErrorDetail} from 'src/app/_models/error_detail';
import {AuthService} from '../../_services/auth.service';
import {MappingImportSource} from 'src/app/_models/mapping_import_source';
import {ImportMappingFile, ImportMappingFileParams, InitSelectedMappingFile} from 'src/app/store/source-feature/source.actions';
import {MappingImportComponent} from '../mapping-import/mapping-import.component';
import { MappingNotesComponent } from '../mapping-table-notes/mapping-notes.component';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { TableColumn } from '../mapping-table/mapping-table.component';
import { TargetChangedService } from 'src/app/_services/target-changed.service';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'app-mapping-view',
  templateUrl: './mapping-view.component.html',
  styleUrls: ['./mapping-view.component.css']
})
export class MappingViewComponent implements OnInit, AfterViewInit, OnDestroy {

  private subscription = new Subscription();
  private debounce = 200;

  private mapping_id: string | null = null;

  private import_dialog_width = '1000px';

  mapping: Mapping | null | undefined;
  error: ErrorInfo = {};
  sort: MatSort | null | undefined;
  componentLoaded = false;
  mappingTableSelector: MappingTableSelectorComponent | null | undefined;
  allSelected = false;

  // @ts-ignore
  @ViewChild(MatTable) table: MatTable<any>;
  @ViewChild(MatPaginator, {static: false}) paginator!: MatPaginator;

  // @ts-ignore
  @ViewChild(MatSort, {static: false}) set content(sort: MatSort) {
    if (!this.componentLoaded && sort) {
      this.sort = sort;
      this.ngAfterViewInit();
      this.componentLoaded = true;
    }
  }

  // @ts-ignore
  @ViewChild(MappingTableSelectorComponent, {static: false})
  set concent(selector: MappingTableSelectorComponent) {
    this.mappingTableSelector = selector;
  }

  page: Page = new Page();
  allSourceDetails: MappedRowDetailsDto[] = [];

  /** 
   * Columns displayed in the table - specified in html. Columns IDs can be added, removed, or reordered. 
   */
  displayedColumns: TableColumn[] = [
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
    {columnId: 'assignedAuthor', columnDisplay: 'TABLE.AUTHOR', displayed: true},
    {columnId: 'assignedReviewer', columnDisplay: 'TABLE.REVIEWER', displayed: true}
  ];
  // columns that are eligable for user controlling the hiding / displaying
  hideShowColumns: string[] = [
  ];
  constantHideShowColumns: string[] = [
    'sourceIndex',
    'sourceCode',
    'sourceDisplay',
    'targetCode',
    'targetDisplay',
    'relationship',
    'lastAuthorReviewer',
    'assignedAuthor',
    'assignedReviewer'
  ];
  additionalDisplayedColumns: TableColumn[] = [];
  additionalHideShowColumns: string[] = [];
  filteredColumns: string[] = [
  ];
  constantFilteredColumns: string[] = [
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
    'filter-assignedAuthor',
    'filter-assignedReviewer'
  ];
  additionalFilteredColumns: string[] = [];

  loading = true;
  mapLoading = true;
  mappingFileLoading = true;
  selectedLabel = '';
  myTasks: Task[] = [];
  currentUser: User = new User(); // loaded in home.component.ts onActivate
  paging: MapViewPaging;
  filterEntity: MapViewFilter;
  filterType: MatTableFilter;
  filterParams: HttpParams = new HttpParams();
  relationships: MapRowRelationship[];
  statuses: MapRowStatus[];
  noMapOptions: [string, boolean][];
  members: User[] = [];
  opened = false;
  private selectedMappingFile: ImportMappingFileParams | null | undefined = undefined;
  isAdmin = false;
  authPageSize = 10;
  authCurrentPage = 0;
  reviewPageSize = 10;
  reviewCurrentPage = 0;
  reconcilePageSize = 10;
  reconcileCurrentPage = 0;

  private timeout: NodeJS.Timeout | null = null;

  // tslint:disable-next-line:variable-name
  private _filterEnabled = false;

  set filterEnabled(value: boolean) {
    if (this._filterEnabled && !value) {
      this.clearFilter();
    }
    this._filterEnabled = value;
  }

  get filterEnabled(): boolean {
    return this._filterEnabled;
  }

  constructor(private router: Router,
              private dialog: MatDialog,
              // tslint:disable-next-line:variable-name
              private _bottomSheet: MatBottomSheet,
              private route: ActivatedRoute,
              private store: Store<IAppState>,
              private translate: TranslateService,
              private mapService: MapService,
              private authService: AuthService,
              private targetChangedService: TargetChangedService) {
    this.translate.get('TASK.SELECT_A_TASK').subscribe((res) => this.selectedLabel = res);

    this.paging = new MapViewPaging();
    this.filterEntity = new MapViewFilter();
    this.filterType = MatTableFilter.ANYWHERE;
    this.relationships = mapRowRelationships;
    this.statuses = mapRowStatuses;
    this.isAdmin = this.authService.isAdmin();
    this.noMapOptions = [
      ['NO_MAP_TRUE', true],
      ['NO_MAP_FALSE', false]
    ];

  }

  ngOnInit(): void {

    const self = this;
    this.store.dispatch(new InitSelectedMappingFile());
    self.loadParams();
    // Subscriptions
    this.subscription.add(this.store.select(selectMappingFile).subscribe(
      (result) => {
        this.selectedMappingFile = result;
      })
    );
    this.subscription.add(this.store.select(selectMappingFileSuccess).subscribe(
      (result) => {
        if (result) {
          let theMessage = '';
          self.translate.get('IMPORT.IMPORT_RESULT',
          {
            recordCount: result?.recordCount,
            insertCount: result?.insertCount
          }).subscribe(res => {
            theMessage = res;
          });
          const sheetCfg: MatBottomSheetConfig = {
            data: {
              message: theMessage,
              infoIcon: true
            }
          };
          this._bottomSheet.open(ResultsdialogComponent, sheetCfg);
          self.refreshPage();
        }
      })
    );
    self.loadMap();
    self.loadTaskList();
  }

  ngAfterViewInit(): void {

    if (this.sort) {
      if (this.paging.sortCol) {
        this.sort.active = this.paging.sortCol;
      }
      switch (this.paging.sortDirection) {
        case 'asc':
        case 'desc':
          this.sort.direction = this.paging.sortDirection;
      }
      this.sort.sortChange.emit();  // Work-around to initialise view

      merge(this.sort.sortChange, this.paginator.page)
        .pipe(tap(() => {
            this.paging.pageIndex = this.paginator.pageIndex;
            this.paging.pageSize = this.paginator.pageSize;
            this.paging.sortCol = this.sort?.active;
            this.paging.sortDirection = this.sort?.direction;
            this.filterRows();
          })
        ).subscribe();
    }

  }

  ngOnDestroy(): void {
    this.loading = false;
    this.subscription.unsubscribe();
  }

  getDataListId(index : number) {
    return "no_additional_column_display" + index;
  }

  /**
   * Set up subscriptions on path params and query params.
   * Should only be called once.
   */
  loadParams(): void {
    this.subscription.add(this.route.params.subscribe(params => {
      this.mapping_id = ServiceUtils.cleanParamId(params.mappingid);
      if (this.mapping_id) {
        this.store.dispatch(new LoadMapping({id: this.mapping_id}));
      } else {
        this.translate.get('ERROR.LOAD_MAP').subscribe((msg) => this.error = msg);
      }
    }));    

    this.subscription.add(this.route.queryParams.subscribe(qparams => {
        this.filterEntity = ServiceUtils.paramsToFilterEntity(qparams);
      if (this.filterEntity.hasFilters()) {
        this._filterEnabled = true;
      }
      this.filterParams = ServiceUtils.filtersToParam(this.filterEntity);
      this.paging = ServiceUtils.pagingParamsToMapViewPaging(qparams);
      this.refreshPage();
    }));
    // TODO this potentially caused problems on creating a new map, investigate further    
    // this.subscription.add(this.route.queryParams
    //   .subscribe(qparams => {
    //     // subscription emits a value immediately  .. ignore if empty
    //     // note that you can't simply ignore the first value here as it may be a page refresh and the
    //     // value may be the selected filters
    //     if (Object.keys(qparams).length > 0) { 
    //       this.filterEntity = ServiceUtils.paramsToFilterEntity(qparams);
    //       if (this.filterEntity.hasFilters()) {
    //         this._filterEnabled = true;
    //       }
    //       this.filterParams = ServiceUtils.filtersToParam(this.filterEntity);
    //       this.paging = ServiceUtils.pagingParamsToMapViewPaging(qparams);
    //       this.refreshPage();
    //     }
    // }));
  }

  /**
   * Load Data subscriptions
   */
  loadMap(): void {
    const self = this;
    self.subscription.add(self.store.select(selectMappingLoading).subscribe((res) => {
      self.mapLoading = res;
      self.loading = res || self.mappingFileLoading;
    }));
    self.subscription.add(self.store.select(selectMappingFileLoading).subscribe((res) => {
      self.mappingFileLoading = res;
      self.loading = res || self.mapLoading;
    }));
    self.subscription.add(self.store.select(selectMappingFileError).subscribe((res) => {
      if (res) {
        self.translate.get('MAP.FAILED_TO_IMPORT_MAPPING_FILE').subscribe((err) => {
          self.error.message = err;
          self.error.detail = res.title;
        });
        let details = JSON.stringify(res);
        if (res.error) {
          if (res.error.detail) {
            if (res.error.detail.startsWith("No enum constant org.snomed.snap2snomed.model.enumeration.MappingRelationship")) {
              const val = res.error.detail.substr(res.error.detail.lastIndexOf('.') + 1);
              this.translate.get('ERROR.FILE_CONTENTS_INVALID_RELATIONSHIP', {val: val}).subscribe((msg) => {
                details = msg;
              })
            }
            else if (res.error.detail.startsWith("No enum constant org.snomed.snap2snomed.model.enumeration.MapStatus")) {
              const val = res.error.detail.substr(res.error.detail.lastIndexOf('.') + 1);
              this.translate.get('ERROR.FILE_CONTENTS_INVALID_MAP_STATUS', {val: val}).subscribe((msg) => {
                details = msg;
              })
            }
            else {
              details = res.error.detail;
            }
          } else if (res.error.title) {
            details = res.error.title;
          }
        }
        self.translate.get('MAP.FAILED_TO_IMPORT_MAPPING_FILE_ERROR', {
          error: details
        }).subscribe((err) => {
          const errorDetail = new ErrorDetail();
          errorDetail.title = err;
          errorDetail.detail = '';
          self.error.detail = errorDetail;
        });
      }
    }));

    self.subscription.add(self.store.select(selectCurrentMapping).pipe(debounceTime(200)).subscribe(
      (mapping) => {
        if (this.mapping_id === mapping?.id) {
          self.mapping = mapping;

          // add in the reconciler column to the table if it is a dual map
          if (this.mapping?.project.dualMapMode) {
            this.addReconcilerTableColumn();
          }

          // this refreshes the task component when new tasks are added
          if (self.mapping && self.mapping.id && self.mapping_id === self.mapping.id) {
            self.store.dispatch(new LoadTasksForMap({id: self.mapping.id, 
                authPageSize: self.authPageSize, authCurrentPage: self.authCurrentPage, 
                reviewPageSize: self.reviewPageSize, reviewCurrentPage: self.reviewCurrentPage,
                reconcilePageSize: self.reconcilePageSize, reconcileCurrentPage: self.reconcileCurrentPage}));
            self.members = self.mapping.project.owners.concat(self.mapping.project.members).concat(self.mapping.project.guests);
          }
        }
      })
    );
    self.subscription.add(this.store.select(selectCurrentView).pipe(startWith(null)).subscribe(
      (page) => {
        if (page) {

          // This code has been written to cater for this being executed multiple times (which is the case)

          self.page = page ?? new Page();

          this.additionalDisplayedColumns = [];
          this.additionalFilteredColumns = [];
          this.additionalHideShowColumns = [];

          // NB: additionalDisplayedColumns and displayedColumns must be set together or the table will error
          // as the html will be out of sync with the model (same applies to additionalFilteredColumns and filteredColumns)
          for (let i = 0; i <  this.page.additionalColumns.length; i++) {
            this.additionalDisplayedColumns.push({columnId: "additionalColumn" + (i+1), columnDisplay: this.page.additionalColumns[i].name, displayed: true});
            this.additionalFilteredColumns.push("filter-additionalColumn" + (i+1));
            this.additionalHideShowColumns.push("additionalColumn" + (i+1));
          }

          // display additional columns at the end of the table
          //this.displayedColumns = this.constantColumns.concat(this.additionalDisplayedColumns);
          //this.filteredColumns = this.constantFilteredColumns.concat(this.additionalFilteredColumns);
          //this.hideShowColumns = this.constantHideShowColumns.concat(this.additionalHideShowColumns);

          // display additional columns after source columns
          this.displayedColumns = this.constantColumns.slice(0,4).concat(this.additionalDisplayedColumns).concat(this.constantColumns.slice(4));
          this.filteredColumns = this.constantFilteredColumns.slice(0,4).concat(this.additionalFilteredColumns).concat(this.constantFilteredColumns.slice(4));
          this.hideShowColumns = this.constantHideShowColumns.slice(0,3).concat(this.additionalHideShowColumns).concat(this.constantHideShowColumns.slice(3));
          
          if (page?.sourceDetails) {
            self.allSourceDetails = page.sourceDetails;
          }
        }
      })
    );
  }

  private getContext(): ViewContext {
    return {
      pageIndex: this.paging.pageIndex ?? 0,
      pageSize: this.paging.pageSize ?? 20,
      sortColumn: this.paging.sortCol,
      sortDir: this.paging.sortDirection,
      filter: this.filterParams
    };
  }

  refreshPage(): void {
    if (this.mapping_id) {
      const context = this.getContext();
      this.store.dispatch(new LoadMapView({mapping: this.mapping_id, context}));
    }
  }

  getDisplayedColumns() : string[] {
    return this.displayedColumns.filter(obj => obj.displayed === true).map((obj) => obj.columnId);
  }

  onHideShowChange(event_checked : MatCheckboxChange, column: string) {

    if (event_checked.checked === false) {
      const columnNames = this.displayedColumns.map((obj) => obj.columnId);
      const index = columnNames.indexOf(column, 0);
      if (index > -1) {
        this.displayedColumns[index].displayed = false;
      }
    }
    else {
      const columnNames = this.displayedColumns.map((obj) => obj.columnId);
      const index = columnNames.indexOf(column, 0);
      if (index > -1) {
        this.displayedColumns[index].displayed = true;
      }
    }

  }

  isFilterColumnVisible(filterId : string) : boolean {

    let visible = true;
    let foundColumn = this.displayedColumns.find(column => column.columnId === filterId.substring("filter-".length));
    if (foundColumn) {
      visible = foundColumn.displayed;
    }

    return visible; 
  }

  getHideShowItemLabel(columnName : string) : string {
    const columnNames = this.displayedColumns.map((obj) => obj.columnId);
    const index = columnNames.indexOf(columnName, 0);
    if (index > -1) {
      return this.displayedColumns[index].columnDisplay;
    }
    return "unknown";
  }

  editMapping(): void {
    this.opened = true;
  }

  closeEdit(): void {
    this.opened = false;
  }

  exportMapViewAdditionalColumns(type: string, additionalColumns: string[]) {
    this.setLoading();
    let contentType: string;
    let extension: string;
    switch (type) {

      case 'tsv':
        contentType = 'text/tab-separated-values';
        extension = '.tsv';
        break;

      case 'xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = '.xlsx';
        break;

      case 'fhir-json':
        contentType = 'application/fhir+json';
        extension = '.json';
        break;
  
      case 'csv':
      default:
        contentType = 'text/csv';
        extension = '.csv';
    }

    if (this.mapping && this.mapping.id) {
      this.mapService.exportMapView(this.mapping.id, contentType, additionalColumns)
        .subscribe(blob => saveAs(blob, this.mapping?.project.title + '_' + this.mapping?.mapVersion + extension),
          (error) => {
            console.log(error);
            this.translate.get('ERROR.EXPORT_FAILED').subscribe((msg) => this.error = msg);
          }).add(() => this.clearLoading());
    }
  }

  exportMapView(type: string): void {
    this.exportMapViewAdditionalColumns(type, []);
  }

  loadTaskList(): void {
    const self = this;
    this.subscription.add(self.store.select(selectTaskList).pipe(startWith(null), debounceTime(200)).subscribe(
      data => {
        if (data) { // cannot ignore empty lists here as it could indicate all tasks being removed

          const newTasks = data.filter(task => task.assignee?.id === self.currentUser?.id)
            .sort((a, b) => AssignedWorkComponent.sortTasks(a, b));
          // TODO this equals checking is not working due to a slight time difference in times reported
          // it would remove unnecessry calls to refreshpage and improve responsiveness
          // if it could be fixed 
          if (JSON.stringify(self.myTasks) !== JSON.stringify(newTasks)) {
            self.myTasks = newTasks;
            this.refreshPage();
          } 
        }
      },
      (error) => self.translate.get('TASK.FAILED_TO_LOAD_TASKS').subscribe((err) => {
        self.error.message = err;
        self.error.detail = error;
      })
    ));
    // TODO this potentially cause new maps to not load, investigate further before reinstating
    // this.subscription.add(self.store.select(selectTaskList).pipe(startWith(null), debounceTime(200)).subscribe(
    //   data => {
    //     if (data) { // cannot ignore empty lists here as it could indicate all tasks being removed

    //       const newTasks = data.filter(task => task.assignee?.id === self.currentUser?.id)
    //         .sort((a, b) => AssignedWorkComponent.sortTasks(a, b));
    //       // TODO this equals checking is not working due to a slight time difference in times reported
    //       // it would remove unnecessry calls to refreshpage and improve responsiveness
    //       // if it could be fixed 
    //       if (JSON.stringify(self.myTasks) !== JSON.stringify(newTasks)) {
    //         self.myTasks = newTasks;
    //         this.refreshPage();
    //       } 
    //     }
    //   },
    //   (error) => self.translate.get('TASK.FAILED_TO_LOAD_TASKS').subscribe((err) => {
    //     self.error.message = err;
    //     self.error.detail = error;
    //   })
    // ));
  }

  addReconcilerTableColumn() {
    
    // check if already added as sometimes the column appears multiple times due to multiple mapping selection events
    if (this.constantFilteredColumns[this.constantFilteredColumns.length-1] !== "filter-assignedReconciler") {
      this.constantFilteredColumns.push("filter-assignedReconciler");
      this.constantHideShowColumns.push("assignedReconciler");
      this.constantColumns.push({columnId: 'assignedReconciler', columnDisplay: 'TABLE.RECONCILER', displayed: true});
      //TODO reinvestigate if this is needed following investigation of excessive refresh improvements
      //this.refreshPage();
    }

  }

  explainRelationship(relationship: string | null): string {
    return ServiceUtils.explainRelationship(this.translate, relationship);
  }

  filterChange(): void {
    this.paging.pageIndex = 0;
    this.mappingTableSelector?.clearAllSelectedRows();
    this.filterRows();
  }

  filterRows(): void {
    if (this.filterEntity) {
      const params: any = {};
      if (this.paging.pageIndex) {
        params.pageIndex = this.paging.pageIndex;
      }
      if (this.paging.pageSize) {
        params.pageSize = this.paging.pageSize;
      }
      if (this.sort?.active) {
        params.sortCol = this.sort.active;
      }
      if (this.sort?.direction) {
        params.sortDirection = this.sort.direction;
      }

      const filter: any = this.filterEntity;
      Object.keys(filter).forEach(key => {
        const value = filter[key];
        if ('additionalColumns' === key && value.length > 0) {
          params[key] = value.join(',');
        } else if (value !== undefined) {
          params[key] = value;
        }
      });
      this.router.navigate(['map-view', this.mapping_id], {queryParams: params, replaceUrl: true});
    }
  }

  clearFilter(): void {
    this.mappingTableSelector?.clearAllSelectedRows();
    const params: any = {};
    params.pageSize = this.paging.pageSize ?? 20;
    this.router.navigate(['map-view', this.mapping_id], {queryParams: params, replaceUrl: true});
  }

  hasSelectedRows(): boolean {
    return (this.mappingTableSelector?.selectedRows && this.mappingTableSelector?.selectedRows.length > 0) || false;
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

  isOwner(): boolean {
    return this.mapping?.project.owners.map(u => u.id).includes(this.currentUser.id) ?? false;
  }

  isDualMapMode(): boolean {
    let isDualMapMode = false;

    if (this.mapping && this.mapping.project.dualMapMode) {
      isDualMapMode = this.mapping.project.dualMapMode;
    }
    return isDualMapMode;
  }

  private setLoading(): void {
    // in case action is taking some time, display spinner
    this.timeout = setTimeout(() => {
      if (this.timeout) {
        this.loading = true;
      }
    }, 500);
  }

  private clearLoading(): void {
    if (this.timeout) {
      const timeout = this.timeout;
      this.timeout = null;
      clearTimeout(timeout);
    }
    this.loading = false;
  }

  private validateError(err: any): void {
    this.clearLoading();
    this.translate.get('MAP.VALIDATE_TARGETS_ERROR').subscribe(res => {
      this.error = {
        message: res,
        detail: err,
      };
    });
    console.log(err);
  }

  clickValidateTargets(): void {
    if (this.mapping_id) {
      this.setLoading();
      this.mapService.validateTargetCodes(this.mapping_id).subscribe(validationResult => {
        if ((validationResult.inactive.length + validationResult.absent.length + validationResult.invalid.length) > 0) {
          this.refreshTable('validated');
        }
        this.targetChangedService.changeTarget({}); // needs to update on a zero count
        this.clearLoading();
      }, err => {
        this.validateError(err);
        this.clearLoading();
      });
    }
  }

  clickBulkChange(): void {
    const self = this;
    const confirmDialogRef =
      self.dialog.open(BulkchangeComponent, {data: self.getBulkChangeDialogData()});
    confirmDialogRef.afterClosed().subscribe(
      (result) => {
        if (result) {
          const msg = getResultMessage(this.translate, result);
          const sheetCfg: MatBottomSheetConfig = {
            data: {
              message: msg,
              infoIcon: true
            },
          };
          if (result.error) {
            sheetCfg.data.error = true;
          }
          this._bottomSheet.open(ResultsdialogComponent, sheetCfg);
          this.mappingTableSelector?.clearAllSelectedRows();
          this.refreshTable('');
        }
      },
      (error) => {
        if (error?.error) {
          self.translate.get('BULKCHANGEDIALOG.ERROR_DEFAULT_MESSAGE').subscribe(res => {
            self.error.message = res;
            self.error.detail = error?.error;
          });
        } else {
          self.error.message = error;
        }
      });

  }

  clickImport(): void {
    const dialogRef = this.dialog.open(MappingImportComponent, {
      width: this.import_dialog_width, data: {
        source: new MappingImportSource(),
        createMode: false
      }
    });

    dialogRef.afterClosed().subscribe(
      (result: any) => {
        if (this.selectedMappingFile && this.mapping) {
          this.selectedMappingFile.source.mapId = this.mapping.id;
          this.store.dispatch(new ImportMappingFile(this.selectedMappingFile));
        }
    });
  }

  onAllSelected(allSelected: boolean) {
    this.allSelected = allSelected;
  }

  getBulkChangeDialogData(): BulkChangeDialogData {
    return {
      task: null,
      map: this.mapping,
      isMapView: this.isOwner(),
      selectedRows: this.mappingTableSelector?.selectedRows,
      allSelected: this.allSelected
    };
  }

  refreshTable($event: string): void {
    if (this.mapping_id) {
      // this.store.dispatch(new LoadMapping({id: this.mapping_id}));
      console.log("refresh table");
      this.refreshPage();
    }
  }

  updateCurrentTaskPage($event: string) {
    switch ($event) {
      case TaskType.AUTHOR:
        this.authCurrentPage = 0;
        break;
      case TaskType.REVIEW:
        this.reviewCurrentPage = 0;
        break;
      case TaskType.RECONCILE:
        this.reconcileCurrentPage = 0;
        break;
    }
  }
}
