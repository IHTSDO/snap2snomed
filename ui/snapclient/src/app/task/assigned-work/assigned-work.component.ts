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
import {selectTaskList, selectTaskLoadError, selectTaskLoading} from '../../store/task-feature/task.selectors';
import {Task, TaskType} from '../../_models/task';
import {User} from '../../_models/user';
import {Mapping} from '../../_models/mapping';
import {Subscription} from 'rxjs';
import {selectCurrentUser} from '../../store/auth-feature/auth.selectors';
import {MatTabChangeEvent} from '@angular/material/tabs';
import {ErrorInfo} from 'src/app/errormessage/errormessage.component';
import { MappedRowDetailsDto } from 'src/app/_models/map_row';
import { MappingTableSelectorComponent } from 'src/app/mapping/mapping-table-selector/mapping-table-selector.component';
import {AuthService} from '../../_services/auth.service';


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
    self.subscription.add(self.store.select(selectTaskList).subscribe(
      data => {
        self.authorTasks = data.filter(task => task.type === TaskType.AUTHOR)
          .sort((a, b) => AssignedWorkComponent.sortTasks(a, b));
        self.reviewTasks = data.filter(task => task.type === TaskType.REVIEW)
          .sort((a, b) => AssignedWorkComponent.sortTasks(a, b));
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
