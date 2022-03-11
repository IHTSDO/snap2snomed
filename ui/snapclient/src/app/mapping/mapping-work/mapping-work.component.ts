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

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Params, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {IAppState} from '../../store/app.state';
import {TranslateService} from '@ngx-translate/core';
import {
  selectCurrentMapping,
  selectCurrentView,
  selectMappingError
} from '../../store/mapping-feature/mapping.selectors';
import {Task, TaskType} from '../../_models/task';
import {MatSelect} from '@angular/material/select';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {LoadMapping, LoadMapView, LoadTaskView, ViewContext} from '../../store/mapping-feature/mapping.actions';
import {AuthService} from '../../_services/auth.service';
import {Subscription} from 'rxjs';
import {Mapping} from 'src/app/_models/mapping';
import {Sort} from '@angular/material/sort';
import {PageEvent} from '@angular/material/paginator';
import {MapView, MapViewFilter, Page} from 'src/app/_models/map_row';
import {ServiceUtils} from 'src/app/_utils/service_utils';
import {MappingTableComponent, TableParams} from '../mapping-table/mapping-table.component';
import {selectTaskList} from 'src/app/store/task-feature/task.selectors';
import {AssignedWorkComponent} from 'src/app/task/assigned-work/assigned-work.component';
import {SourceRow} from '../mapping-detail/mapping-detail.component';
import {SourceNavigationService} from 'src/app/_services/source-navigation.service';
import {ConceptNode} from '@csiro/shrimp-hierarchy-view';
import {Coding} from 'src/app/store/fhir-feature/fhir.reducer';
import {SelectionService} from 'src/app/_services/selection.service';
import {selectConceptHierarcy} from 'src/app/store/fhir-feature/fhir.selectors';
import {ConceptHierarchy} from 'src/app/store/fhir-feature/fhir.actions';
import {FhirService} from 'src/app/_services/fhir.service';
import {MapService} from 'src/app/_services/map.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {BulkchangeComponent, BulkChangeDialogData, getResultMessage} from '../bulkchange/bulkchange.component';
import {ResultsdialogComponent} from 'src/app/resultsdialog/resultsdialog.component';
import {MatBottomSheet, MatBottomSheetConfig} from '@angular/material/bottom-sheet';
import {User} from '../../_models/user';

const enum TaskMode {
  AUTHOR_TABLE = 'AUTHOR_TABLE_VIEW',
  AUTHOR_DETAILS = 'AUTHOR_DETAILS_VIEW',
  REVIEW_TABLE = 'REVIEW_TABLE_VIEW',
  REVIEW_DETAILS = 'REVIEW_DETAILS_VIEW',
}

@Component({
  selector: 'app-mapping-work',
  templateUrl: './mapping-work.component.html',
  styleUrls: ['./mapping-work.component.css']
})
export class MappingWorkComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();

  private mapping_id: string | null = null;
  private task_id: string | null = null;

  private page: Page = new Page();

  mapping: Mapping | null = null;
  myTasks: Task[] = [];
  task: Task | null = null;
  currentUser: User | null = null;

  nodes: ConceptNode<Coding>[] = [];
  loadingHierarchy = false;
  private timeout: NodeJS.Timeout | null = null;
  hierarchyView = 'tree';
  currentSelection: any;
  error: ErrorInfo = {};
  loading = false;
  opened = false;
  selectedLabel = '';
  params: Params = {};
  filterEnabled = false;
  tableParams: TableParams;
  tableFilter: MapViewFilter;
  mode = TaskMode.AUTHOR_TABLE; // DEFAULT VIEW
  source: SourceRow | null = null;
  @ViewChild(MatSelect) taskSelect: MatSelect | undefined;
  @ViewChild('mapTable', {static: false}) mapTable: MappingTableComponent | undefined;
  automapping = false;
  isAdmin = false;
  private navigationSubscription: Subscription;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private snackBar: MatSnackBar,
              private dialog: MatDialog,
              // tslint:disable-next-line:variable-name
              private _bottomSheet: MatBottomSheet,
              private store: Store<IAppState>,
              private selectionService: SelectionService,
              private sourceNavigation: SourceNavigationService,
              private fhirService: FhirService,
              private mapService: MapService,
              private translate: TranslateService,
              private authService: AuthService) {
    this.translate.get('TASK.SELECTED_TASK').subscribe((res) => this.selectedLabel = res);
    this.tableParams = {};
    this.tableFilter = new MapViewFilter();
    this.isAdmin = this.authService.isAdmin();
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      // Refresh page re-load params and data
      if (e instanceof NavigationEnd) {
        this.handleParams();
      }
    });
  }

  ngOnInit(): void {
    const self = this;

    self.loadHeirarchy();
    self.handleParams();
    self.automapping = false;

    self.subscription.add(self.store.select(selectCurrentView).subscribe(
      (page) => {
        self.page = page ?? new Page();
      })
    );

    self.subscription.add(self.store.select(selectCurrentMapping).subscribe((res) => {
      if (res) {
        self.error = {};
        self.mapping = res;
      }
    }));

    self.subscription.add(self.store.select(selectTaskList).subscribe((res) => {
        const user_id = self.currentUser ? self.currentUser.id : AuthService.getUseridFromSession();
        self.myTasks = self.isAdmin ? res : res.filter(task => task.assignee?.id === user_id)
          .sort((a, b) => AssignedWorkComponent.sortTasks(a, b));
        self.updateCurrentTask();
      },
      (error) => self.translate.get('TASK.FAILED_TO_LOAD_TASKS').subscribe((err) => {
        self.error.message = err;
        self.error.detail = error;
      })
    ));

    self.subscription.add(self.store.select(selectMappingError).subscribe((error) => {
      if (error !== null) {
        self.translate.get('ERROR.LOAD_MAP_TASK').subscribe((err) => {
          self.error.message = err;
          self.error.detail = error;
        });
      }
    }));

    self.subscription.add(self.store.select(selectConceptHierarcy).subscribe((nodes) => {
      if (!self.opened) {
        self.nodes = nodes;
        self.clearLoading();
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

  private loadHeirarchy(): void {
    const view = localStorage.getItem('hierarchyView');
    if (null === view) {
      localStorage.setItem('hierarchyView', this.hierarchyView);
    } else {
      this.hierarchyView = view;
    }
  }

  private handleSelection(): void {
    const self = this;
    const selection = self.currentSelection;

    if (!self.opened && selection?.code) {
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
    this.loading = false;
    this.automapping = false;
    this.subscription.unsubscribe();
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  onSelected(node: Coding): void {
    this.selectionService.select(node);
  }

  updateCurrentTask(): void {
    const self = this;
    if (self.task_id) {
      self.task = self.myTasks.find(task => task.id === self.task_id) ?? null;
      if (null !== self.task) {
        self.automapping = false;
        if (self.source) {
          self.mode = self.task.type === TaskType.AUTHOR ? TaskMode.AUTHOR_DETAILS : TaskMode.REVIEW_DETAILS;
        } else {
          self.mode = self.task.type === TaskType.AUTHOR ? TaskMode.AUTHOR_TABLE : TaskMode.REVIEW_TABLE;
        }
      }
    }
  }

  handleParams(): void {
    this.route.params.subscribe(params => {
      const mappingid = ServiceUtils.cleanParamId(params.mappingid);
      const taskid = ServiceUtils.cleanParamId(params.taskid);

      if (mappingid) {
        this.mapping_id = mappingid;
        this.store.dispatch(new LoadMapping({id: mappingid}));
      }

      if (this.task_id !== taskid && taskid) {
        this.task_id = taskid;
        this.updateCurrentTask();
      }
      this.route.queryParams.subscribe(qparams => {
        this.tableFilter = ServiceUtils.paramsToFilterEntity(qparams);
        this.filterEnabled = this.tableFilter.hasFilters();
        this.tableParams = ServiceUtils.pagingParamsToTableParams(qparams);
        this.loadPage();
      });
    });
  }

  private getContext(): ViewContext {
    return {
      pageIndex: this.tableParams.pageIndex ?? 0,
      pageSize: this.tableParams.pageSize ?? 20,
      sortColumn: this.tableParams.sortCol,
      sortDir: this.tableParams.sortDirection,
      filter: ServiceUtils.filtersToParam(this.tableFilter),
    };
  }

  loadPage(): void {
    const context = this.getContext();
    if (this.task_id) {
      this.store.dispatch(new LoadTaskView({task: this.task_id, context}));
    } else if (this.mapping?.id) {
      this.store.dispatch(new LoadMapView({mapping: this.mapping.id, context}));
    }
  }

  isTableView(): boolean {
    return this.mode === TaskMode.AUTHOR_TABLE || this.mode === TaskMode.REVIEW_TABLE;
  }

  isDetailsView(): boolean {
    return this.mode === TaskMode.AUTHOR_DETAILS || this.mode === TaskMode.REVIEW_DETAILS;
  }

  filterRows(): void {
    let params = ServiceUtils.filtersToParam(this.tableFilter);
    if (this.tableParams.pageIndex) {
      params = params.set('pageIndex', this.tableParams.pageIndex.toString());
    }
    if (this.tableParams.pageSize) {
      params = params.set('pageSize', this.tableParams.pageSize.toString());
    }
    if (this.tableParams.sortCol) {
      params = params.set('sortCol', this.tableParams.sortCol);
    }
    if (this.tableParams.sortDirection) {
      params = params.set('sortDirection', this.tableParams.sortDirection);
    }
    const qparams: any = {};
    params.keys().forEach((k) => {
      qparams[k] = params.getAll(k);
    });

    // Reload URL with params
    this.router.navigate(['map-view', this.mapping_id, 'map-work', this.task_id],
      {queryParams: qparams, replaceUrl: true});
  }

  detailClosed(): void {
    this.opened = false;
  }

  hideDetail(): void {
    this.opened = false;

    const view = localStorage.getItem('hierarchyView');
    if (null !== view) {
      this.hierarchyView = view;
    }
    this.handleSelection();

    this.loadPage();
  }

  showDetail(row_idx: number): void {
    const self = this;
    if (self.task_id) {
      self.sourceNavigation.loadSourceNav(self.task_id, this.getContext(), row_idx);
      self.opened = true;
      self.mode = self.task?.type === 'AUTHOR' ? TaskMode.AUTHOR_DETAILS : TaskMode.REVIEW_DETAILS;
    } else {
      self.mode = self.task?.type === 'AUTHOR' ? TaskMode.AUTHOR_TABLE : TaskMode.REVIEW_TABLE;
    }
  }

  sortChange(event: Sort): void {
    this.tableParams.sortDirection = event.direction;
    if (event.direction === '') {
      delete this.tableParams.sortCol;
    } else {
      this.tableParams.sortCol = event.active;
    }
    this.filterRows();
  }

  pagingChange(event: PageEvent): void {
    if (event) {
      if (event.pageIndex) {
        this.tableParams.pageIndex = event.pageIndex;
      } else {
        delete this.tableParams.pageIndex;
      }
      this.tableParams.pageSize = event.pageSize;
      this.filterRows();
    } else {
      this.loadPage();
    }
  }

  filterChange(event: MapViewFilter): void {
    this.tableFilter = event;
    this.filterRows();
  }

  updateTable($event: any): void {
    this.loadPage();
    this.automapping = false;
  }

  launchAutomap(): void {
    this.automapping = true;
  }

  getData(): MapView[] {
    return this.page.data;
  }

  clickBulkChange(): void {
    const self = this;
    const confirmDialogRef = self.dialog.open(BulkchangeComponent,
      {data: self.getBulkChangeDialogData()});
    confirmDialogRef.afterClosed().subscribe(
      (result) => {
        if (result) {
          const msg = getResultMessage(this.translate, result);
          const sheetCfg: MatBottomSheetConfig = {
            data: {message: msg}
          };
          if (result.error) {
            sheetCfg.data.error = true;
          }
          this._bottomSheet.open(ResultsdialogComponent, sheetCfg);
          this.mapTable?.mappingTableSelector?.clearAllSelectedRows();
          this.loadPage();
        }
      },
      (error) => {
        if (error?.error) {
          self.translate.get('ERROR.ERROR_DEFAULT_MESSAGE').subscribe(res => {
            self.error.message = res;
            self.error.detail = error?.error;
          });
        } else {
          self.error.message = error;
        }
      });

  }

  getBulkChangeDialogData(): BulkChangeDialogData {
    return {
      task: this.task,
      map: null,
      isMapView: false,
      selectedRows: this.mapTable?.mappingTableSelector?.selectedRows
    };
  }

}
