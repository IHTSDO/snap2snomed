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

import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {IAppState} from '../../store/app.state';
import {selectAllTasks, selectTaskList, selectTaskLoadError, selectTaskLoading} from '../../store/task-feature/task.selectors';
import {Task, TaskType} from '../../_models/task';
import {User} from '../../_models/user';
import {Mapping} from '../../_models/mapping';
import {Subscription} from 'rxjs';
import {selectCurrentUser} from '../../store/auth-feature/auth.selectors';
import {MatTabChangeEvent} from '@angular/material/tabs';
import {ErrorInfo} from 'src/app/errormessage/errormessage.component';
import {MappingTableSelectorComponent} from 'src/app/mapping/mapping-table-selector/mapping-table-selector.component';
import {AuthService} from '../../_services/auth.service';
import { PageEvent } from '@angular/material/paginator';
import { LoadTasksForMap } from 'src/app/store/task-feature/task.actions';


@Component({
  selector: 'app-assigned-work',
  templateUrl: './assigned-work.component.html',
  styleUrls: ['./assigned-work.component.css']
})
export class AssignedWorkComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscription = new Subscription();
  authorTasks: Task[] | null | undefined;
  reviewTasks: Task[] | null | undefined;
  loading = true;
  currentUser: User = new User();
  error: ErrorInfo = {};
  activeTab = 0;
  taskAvailable = '';
  taskNotAvailable = '';
  isAdmin = false;
  @Input() authPageSize: number | undefined;;
  @Output() authPageSizeChange = new EventEmitter<number>();
  @Input() authCurrentPage: number | undefined;
  @Output() authCurrentPageChange = new EventEmitter<number>();
  @Input() reviewPageSize: number | undefined;
  @Output() reviewPageSizeChange = new EventEmitter<number>();
  @Input() reviewCurrentPage: number | undefined;
  @Output() reviewCurrentPageChange = new EventEmitter<number>();
  authTotalElements = 0;
  reviewTotalElements = 0;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() mapping: Mapping | undefined;
  @Input() mappingTableSelector: MappingTableSelectorComponent | null | undefined;
  @Output() updateTableEvent = new EventEmitter<string>();

  private selectedTaskType: string | null = null;

  constructor(private store: Store<IAppState>,
              private translate: TranslateService,
              private authService: AuthService) {
    this.translate.get('TASK.AVAILABLE').subscribe((msg) => this.taskAvailable = msg);
    this.translate.get('TASK.NOT_AVAILABLE').subscribe((msg) => this.taskNotAvailable = msg);
    this.isAdmin = this.authService.isAdmin();
  }

  // Sort by created desc
  static sortTasks(a: Task, b: Task): number {
    if (a.created && b.created) {
      if (a.created > b.created) {
        return -1;
      }
      if (a.created < b.created) {
        return 1;
      }
    }
    return 0;
  }

  ngOnInit(): void {
    const self = this;
    self.loadData();
    self.selectedTaskType = '';
  }

  ngAfterViewInit(): void {
    const self = this;
    self.setTab();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadData(): void {
    const self = this;
    self.subscription.add(self.store.select(selectCurrentUser).subscribe((res) => self.currentUser = res ?? new User()));
    self.subscription.add(self.store.select(selectTaskLoading).subscribe((res) => self.loading = res));
    self.subscription.add(self.store.select(selectAllTasks).subscribe(
      data => {
        let authPage = data.find(taskPage => taskPage.type === TaskType.AUTHOR);
        let reviewPage = data.find(taskPage => taskPage.type === TaskType.REVIEW);
        self.authorTasks = authPage?.page.tasks
          .sort((a, b) => AssignedWorkComponent.sortTasks(a, b));
        self.reviewTasks = reviewPage?.page.tasks
          .sort((a, b) => AssignedWorkComponent.sortTasks(a, b));
        if (authPage?.page) {
          self.authTotalElements = authPage.page.page.totalElements;
        }
        if (reviewPage?.page) {
          self.reviewTotalElements = reviewPage.page.page.totalElements;
        }
        self.loading = false;
        self.setTab();
      },
      error => {
        self.loading = false;
        self.translate.get('TASK.FAILED_TO_LOAD_TASKS').subscribe((res) => self.error.message = res);
      },
    ));
    self.subscription.add(self.store.select(selectTaskLoadError).subscribe(
      (error) => {
        if (error) {
          self.translate.get('TASK.FAILED_TO_LOAD_TASKS').subscribe((res) => self.error.message = res);
          self.error.detail = error.error;
        }
      }
    ));
  }

  authPageChanged(event: PageEvent): void {
    this.authPageSize = event.pageSize;
    this.authCurrentPage = event.pageIndex;
    this.authPageSizeChange.emit(this.authPageSize);
    this.authCurrentPageChange.emit(this.authCurrentPage);
    this.store.dispatch(new LoadTasksForMap({id: this.mapping?.id, authPageSize: this.authPageSize,
        authCurrentPage: this.authCurrentPage, reviewPageSize: this.reviewPageSize, reviewCurrentPage: this.reviewCurrentPage}));
  }

  reviewPageChanged(event: PageEvent): void {
    this.reviewPageSize = event.pageSize;
    this.reviewCurrentPage = event.pageIndex;
    this.reviewCurrentPageChange.emit(this.reviewCurrentPage);
    this.reviewPageSizeChange.emit(this.reviewPageSize);
    this.store.dispatch(new LoadTasksForMap({id: this.mapping?.id, authPageSize: this.authPageSize,
        authCurrentPage: this.authCurrentPage, reviewPageSize: this.reviewPageSize, reviewCurrentPage: this.reviewCurrentPage}));
  }

  setTab(): void {
    const self = this;
    switch (self.selectedTaskType) {
      case TaskType.AUTHOR:
        self.activeTab = 1;
        break;
      case TaskType.REVIEW:
        self.activeTab = 2;
        break;
      default:
        self.activeTab = 0;
    }
  }

  isAssigned(task: Task): boolean {
    let rtn = false;
    if (this.currentUser && this.currentUser.id && task && task.assignee) {
      rtn = (this.currentUser.id === task.assignee.id) || this.authService.isAdmin();
    }
    return rtn;
  }

  isOwner(): boolean {
    return this.mapping?.project.owners.map(u => u.id).includes(this.currentUser.id) ?? false;
  }

  selectTaskTab($event: string): void {
    if (this.selectedTaskType !== $event) {
      this.selectedTaskType = $event;
    }
    this.updateTableEvent.emit(this.selectedTaskType);
    this.loading = true;
  }

  setActiveTab($event: MatTabChangeEvent): void {
    this.activeTab = $event.index;
    switch (this.activeTab) {
      case 1:
        this.selectedTaskType = TaskType.AUTHOR;
        break;
      case 2:
        this.selectedTaskType = TaskType.REVIEW;
        break;
      default:
        this.selectedTaskType = '';
    }
  }

  isUserInGroup(user: User, group: User[]): boolean {
    return group && group.some((u) => u.id === user.id);
  }
}
