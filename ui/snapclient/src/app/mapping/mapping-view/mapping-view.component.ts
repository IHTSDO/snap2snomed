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

import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
  MapViewFilter,
  MapViewPaging,
  Page
} from '../../_models/map_row';
import {TranslateService} from '@ngx-translate/core';
import {MapService} from '../../_services/map.service';
import {from, merge, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, last, mergeMap, tap} from 'rxjs/operators';
import {MatSort} from '@angular/material/sort';
import {Task} from '../../_models/task';
import {LoadTasksForMap} from '../../store/task-feature/task.actions';
import {saveAs} from 'file-saver';
import {User} from '../../_models/user';
import {selectTaskList} from '../../store/task-feature/task.selectors';
import {AssignedWorkComponent} from '../../task/assigned-work/assigned-work.component';
import {MatTableFilter} from 'mat-table-filter';
import {HttpParams} from '@angular/common/http';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {ServiceUtils} from '../../_utils/service_utils';
import {FormControl} from '@angular/forms';
import {LoadMapping, LoadMapView, ViewContext} from 'src/app/store/mapping-feature/mapping.actions';
import {BulkchangeComponent, BulkChangeDialogData, getResultMessage} from '../bulkchange/bulkchange.component';
import {MatDialog} from '@angular/material/dialog';
import {MatBottomSheet, MatBottomSheetConfig} from '@angular/material/bottom-sheet';
import {ResultsdialogComponent} from 'src/app/resultsdialog/resultsdialog.component';
import {MappingTableSelectorComponent} from '../mapping-table-selector/mapping-table-selector.component';
import {selectMappingFile, selectMappingFileError, selectMappingFileLoading, selectMappingFileSuccess} from 'src/app/store/source-feature/source.selectors';
import {ErrorDetail} from 'src/app/_models/error_detail';
import {FhirService} from 'src/app/_services/fhir.service';
import {AuthService} from '../../_services/auth.service';
import {MappingImportSource} from 'src/app/_models/mapping_import_source';
import {ImportMappingFile, ImportMappingFileParams, InitSelectedMappingFile} from 'src/app/store/source-feature/source.actions';
import {MappingImportComponent} from '../mapping-import/mapping-import.component';

@Component({
  selector: 'app-mapping-view',
  templateUrl: './mapping-view.component.html',
  styleUrls: ['./mapping-view.component.css']
})
export class MappingViewComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscription = new Subscription();
  private debounce = 200;

  private mapping_id: string | null = null;

  private import_dialog_width = '650px';

  mapping: Mapping | null | undefined;
  error: ErrorInfo = {};
  sort: MatSort | null | undefined;
  componentLoaded = false;
  mappingTableSelector: MappingTableSelectorComponent | null | undefined;

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

  sourceCodeFilterControl = new FormControl('');
  sourceDisplayFilterControl = new FormControl('');
  targetCodeFilterControl = new FormControl('');
  targetDisplayFilterControl = new FormControl('');

  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns: string[] = [
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
    'lastAuthorReviewer',
    'assignedAuthor',
    'assignedReviewer'
  ];
  filteredColumns: string[] = [
    'filter-id',
    'filter-source-index',
    'filter-source-code',
    'filter-source-display',
    'filter-target-code',
    'filter-target-display',
    'filter-relationship',
    'filter-noMap',
    'filter-status',
    'filter-flagged',
    'filter-last-author-reviewer',
    'filter-author',
    'filter-reviewer'
  ];
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
              private fhirService: FhirService,
              private authService: AuthService) {
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

    // search as you type
    [this.sourceCodeFilterControl, this.sourceDisplayFilterControl,
      this.targetCodeFilterControl, this.targetDisplayFilterControl].forEach((control) => {
      this.subscription.add(control.valueChanges
        .pipe(debounceTime(this.debounce), distinctUntilChanged())
        .subscribe(() => this.filterChange()
        ));
    });
  }

  ngOnDestroy(): void {
    this.loading = false;
    this.subscription.unsubscribe();
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
      this._filterEnabled = this.filterEntity.hasFilters();
      this.filterParams = ServiceUtils.filtersToParam(this.filterEntity);
      this.paging = ServiceUtils.pagingParamsToMapViewPaging(qparams);
      this.refreshPage();
    }));
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
            details = res.error.detail;
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
          if (self.mapping && self.mapping.id && self.mapping_id === self.mapping.id) {
            self.store.dispatch(new LoadTasksForMap({id: self.mapping.id}));
            self.members = self.mapping.project.owners.concat(self.mapping.project.members).concat(self.mapping.project.guests);
          }
        }
      })
    );
    self.subscription.add(this.store.select(selectCurrentView).subscribe(
      (page) => {
        self.page = page ?? new Page();
        if (page?.sourceDetails) {
          self.allSourceDetails = page.sourceDetails;
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

  editMapping(): void {
    this.opened = true;
  }

  closeEdit(): void {
    this.opened = false;
  }

  exportMapView(type: string): void {
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

      case 'csv':
      default:
        contentType = 'text/csv';
        extension = '.csv';
    }

    if (this.mapping && this.mapping.id) {
      this.mapService.exportMapView(this.mapping.id, contentType)
        .subscribe(blob => saveAs(blob, this.mapping?.project.title + '_' + this.mapping?.mapVersion + extension),
          (error) => {
            console.log(error);
            this.translate.get('ERROR.EXPORT_FAILED').subscribe((msg) => this.error = msg);
          });
    }
  }

  loadTaskList(): void {
    const self = this;
    this.subscription.add(self.store.select(selectTaskList).pipe(debounceTime(200)).subscribe(
      data => {
        this.refreshPage();
        self.myTasks = data.filter(task => task.assignee?.id === self.currentUser?.id)
          .sort((a, b) => AssignedWorkComponent.sortTasks(a, b));
      },
      (error) => self.translate.get('TASK.FAILED_TO_LOAD_TASKS').subscribe((err) => {
        self.error.message = err;
        self.error.detail = error;
      })
    ));
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
        if (value !== undefined) {
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

  isOwner(): boolean {
    return this.mapping?.project.owners.map(u => u.id).includes(this.currentUser.id) ?? false;
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

  getBulkChangeDialogData(): BulkChangeDialogData {
    return {
      task: null,
      map: this.mapping,
      isMapView: this.isOwner(),
      selectedRows: this.mappingTableSelector?.selectedRows
    };
  }

  refreshTable($event: string): void {
    if (this.mapping_id) {
      // this.store.dispatch(new LoadMapping({id: this.mapping_id}));
      this.refreshPage();
    }
  }
}
