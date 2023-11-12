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
import {MappingTableComponent, TableColumn, TableParams} from '../mapping-table/mapping-table.component';
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
import { MatCheckboxChange } from '@angular/material/checkbox';

const enum TaskMode {
  AUTHOR_TABLE = 'AUTHOR_TABLE_VIEW',
  AUTHOR_DETAILS = 'AUTHOR_DETAILS_VIEW',
  REVIEW_TABLE = 'REVIEW_TABLE_VIEW',
  REVIEW_DETAILS = 'REVIEW_DETAILS_VIEW',
  RECONCILE_TABLE = 'RECONCILE_TABLE_VIEW',
  RECONCILE_DETAILS = 'RECONCILE_DETAILS_VIEW',
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
  // private navigationSubscription: Subscription;
  allSelected = false;

  targetConceptSearchText = '';

  // override so have access to populate show / hide column menu
  displayedColumns : TableColumn[] = [
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
    {columnId: 'actions', columnDisplay: '', displayed: true}
  ];
  additionalDisplayedColumns: TableColumn[] = [];
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
  ];
  additionalHideShowColumns: string[] = [];

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
//     this.navigationSubscription = this.router.events.subscribe((e: any) => {
//       // Refresh page re-load params and data
//       if (e instanceof NavigationEnd) {
// console.log('NAV END -> Handle params')
//         this.handleParams();
//       }
//     });
  }

  ngOnInit(): void {
    const self = this;

    self.loadHeirarchy();
    console.log('INIT -> Handle params')
    self.handleParams();
    self.automapping = false;

    self.subscription.add(self.store.select(selectCurrentView).subscribe(
      (page) => {
        self.page = page ?? new Page();

        this.additionalDisplayedColumns = [];
        this.additionalHideShowColumns = [];

        for (let i = 0; i <  this.page.additionalColumns.length; i++) {
          this.additionalDisplayedColumns.push({columnId: "additionalColumn" + (i+1), columnDisplay: this.page.additionalColumns[i].name, displayed: true});
          this.additionalHideShowColumns.push("additionalColumn" + (i+1));
        }

        // display additional columns at the end of the table
        // this.displayedColumns = this.constantColumns.concat(this.additionalDisplayedColumns);
        // this.hideShowColumns = this.constantHideShowColumns.concat(this.additionalHideShowColumns);

        // display additional columns after source columns
        this.displayedColumns = this.constantColumns.slice(0,4).concat(this.additionalDisplayedColumns).concat(this.constantColumns.slice(4));
        this.hideShowColumns = this.constantHideShowColumns.slice(0,3).concat(this.additionalHideShowColumns).concat(this.constantHideShowColumns.slice(3));
        
      })
    );

    self.subscription.add(self.store.select(selectCurrentMapping).subscribe((res) => {
      if (res) {
        self.error = {};
        self.mapping = res;

        // add in the author column to the table if it is a dual map
        if (this.mapping?.project.dualMapMode && this.task?.type === 'RECONCILE') {
          this.addAuthorTableColumn();
        }
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

  private addAuthorTableColumn() {
    
    //check if already added as sometimes the column appears multiple times due to multiple mapping selection events
    if (this.constantColumns.filter(column => column.columnId === 'lastAuthorReviewer').length < 1) {
      this.constantHideShowColumns.push("lastAuthorReviewer");
      // actions should be the final column
      this.constantColumns.splice(-1, 0, {columnId: 'lastAuthorReviewer', columnDisplay: 'TABLE.LAST_AUTHOR', displayed: true});
    }

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
    // if (this.navigationSubscription) {
    //   this.navigationSubscription.unsubscribe();
    // }
  }

  onSelected(node: Coding): void {
    this.selectionService.select(node);
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

  getHideShowItemLabel(columnName : string) : string {
    const columnNames = this.displayedColumns.map((obj) => obj.columnId);
    const index = columnNames.indexOf(columnName, 0);
    if (index > -1) {
      return this.displayedColumns[index].columnDisplay;
    }
    return "unknown";
  }

  updateCurrentTask(): void {
    const self = this;
    if (self.task_id) {
      self.task = self.myTasks.find(task => task.id === self.task_id) ?? null;
      if (null !== self.task) {
        self.automapping = false;
        if (self.source) {
          switch(self.task.type) { 
            case TaskType.AUTHOR: { 
               self.mode = TaskMode.AUTHOR_DETAILS;
               break; 
            } 
            case TaskType.REVIEW: { 
               self.mode = TaskMode.REVIEW_DETAILS;
               break; 
            } 
            case TaskType.RECONCILE: { 
               self.mode = TaskMode.RECONCILE_DETAILS;
               break; 
            } 
         } 
        } else {
          switch(self.task.type) { 
            case TaskType.AUTHOR: { 
               self.mode = TaskMode.AUTHOR_TABLE;
               break; 
            } 
            case TaskType.REVIEW: { 
               self.mode = TaskMode.REVIEW_TABLE;
               break; 
            } 
            case TaskType.RECONCILE: { 
               self.mode = TaskMode.RECONCILE_TABLE;
               break; 
            } 
         } 
        }
      }
    }
  }

  handleParams(): void {
    this.subscription.add(this.route.params.subscribe(params => {
      const mappingid = ServiceUtils.cleanParamId(params.mappingid);
      const taskid = ServiceUtils.cleanParamId(params.taskid);

      if (mappingid && this.mapping_id !== mappingid) {
        this.mapping_id = mappingid;
        this.store.dispatch(new LoadMapping({id: mappingid}));
      }

      if (taskid && this.task_id !== taskid) {
        this.task_id = taskid;
        this.updateCurrentTask();
      }
      this.loadPage();
    }));

    this.subscription.add(this.route.queryParams.subscribe(qparams => {
      this.tableFilter = ServiceUtils.paramsToFilterEntity(qparams);
      this.filterEnabled = this.tableFilter.hasFilters();
      this.tableParams = ServiceUtils.pagingParamsToTableParams(qparams);
      this.loadPage();
    }));
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
    return this.mode === TaskMode.AUTHOR_TABLE || this.mode === TaskMode.REVIEW_TABLE || this.mode === TaskMode.RECONCILE_TABLE;
  }

  isDetailsView(): boolean {
    return this.mode === TaskMode.AUTHOR_DETAILS || this.mode === TaskMode.REVIEW_DETAILS || this.mode === TaskMode.RECONCILE_DETAILS;
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

  hasSelectedRows(): boolean {
    return (this.mapTable?.mappingTableSelector?.selectedRows && this.mapTable?.mappingTableSelector?.selectedRows.length > 0) || false;
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
    if (self.task_id && self.task) {
      self.sourceNavigation.loadSourceNav(self.task, self.task.mapping, this.getContext(), row_idx);
      self.opened = true;
      switch(self.task?.type) { 
        case 'AUTHOR': { 
           self.mode = TaskMode.AUTHOR_DETAILS;
           break; 
        } 
        case 'REVIEW': { 
           self.mode = TaskMode.REVIEW_DETAILS;
           break; 
        } 
        case 'RECONCILE': { 
           self.mode = TaskMode.RECONCILE_DETAILS;
           break; 
        } 
     } 
    } else {
      switch(self.task?.type) { 
        case 'AUTHOR': { 
           self.mode = TaskMode.AUTHOR_TABLE;
           break; 
        } 
        case 'REVIEW': { 
           self.mode = TaskMode.REVIEW_TABLE;
           break; 
        } 
        case 'RECONCILE': { 
           self.mode = TaskMode.RECONCILE_TABLE;
           break; 
        } 
     } 
    }
  }

  targetConceptSearchString(text: string): void {
    this.targetConceptSearchText = text;
  }

  allSelectedChange(allSelected: boolean) {
    this.allSelected = allSelected;
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
      map: this.mapping,
      isMapView: false,
      selectedRows: this.mapTable?.mappingTableSelector?.selectedRows,
      allSelected: this.allSelected
    };
  }

}
