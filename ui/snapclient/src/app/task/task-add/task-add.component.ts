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

import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Task, TaskType} from '../../_models/task';
import {User} from '../../_models/user';
import {IAppState} from '../../store/app.state';
import {TranslateService} from '@ngx-translate/core';
import {ServiceUtils} from '../../_utils/service_utils';
import {MatRadioChange} from '@angular/material/radio';
import {NgForm} from '@angular/forms';
import {Mapping} from '../../_models/mapping';
import {ErrorInfo} from '../../errormessage/errormessage.component';
import {FormUtils} from '../../_utils/form_utils';
import {TaskCreateComponent} from '../task-create/task-create.component';
import {MatDialog} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {AddTask} from 'src/app/store/task-feature/task.actions';
import {Subscription, throwError} from 'rxjs';
import {selectTaskSaveError} from 'src/app/store/task-feature/task.selectors';
import {
  selectCurrentMapping,
  selectSelectedRows
} from '../../store/mapping-feature/mapping.selectors';
import {MappingTableSelectorComponent} from 'src/app/mapping/mapping-table-selector/mapping-table-selector.component';
import {AuthService} from '../../_services/auth.service';

@Component({
  selector: 'app-task-add',
  templateUrl: './task-add.component.html',
  styleUrls: ['./task-add.component.css']
})
export class TaskAddComponent implements OnInit, AfterViewInit, OnDestroy {

  error: ErrorInfo = {};
  task: Task | undefined = undefined;
  members: User[] = [];
  type_options: TaskType[] = [];
  row_options = ['ALL', 'SELECTED'];
  assignRows = '';
  isMember = false;
  isOwner = false;
  isAdmin = false;
  MAX_TASK_DESCRIPTION = FormUtils.MAX_TASK_DESCRIPTION;
  VALID_STRING_PATTERN = FormUtils.VALID_STRING_PATTERN;

  @Input() currentUser: User | null | undefined;
  @Input() mapping: Mapping | undefined;
  @Input() mappingTableSelector: MappingTableSelectorComponent | null | undefined;
  @Output() newTaskEvent = new EventEmitter<string>();
  @Output() cancelNewTaskEvent = new EventEmitter<void>();
  // @ts-ignore
  @ViewChild('taskform', {static: false}) taskform: NgForm;
  createTaskDialogWidth = '600px';
  subscription: Subscription = new Subscription();
  ngModelOptions: { standalone: boolean };

  constructor(private store: Store<IAppState>,
              public translate: TranslateService,
              private authService: AuthService,
              public dialog: MatDialog) {
    this.ngModelOptions = {standalone: true};
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    const self = this;
    self.subscription.add(self.store.select(selectSelectedRows).subscribe(
      (selectedRows) => {
        if (self.task) {
          if (this.mappingTableSelector?.isAllSelected) {
            self.task.sourceRowSpecification = '*';
          }
          else if (selectedRows.length > 0) {
              const sourceIndexes = selectedRows.map(selected => selected.sourceIndex);
              self.task.sourceRowSpecification = ServiceUtils.convertNumberArrayToRangeString(sourceIndexes);
          } else {
            self.assignRows = '';
            self.task.sourceRowSpecification = '';
          }
        }
      }));

    self.subscription.add(self.store.select(selectTaskSaveError).subscribe(
      (error) => {
        if (error) {
          if ([400, 403].indexOf(error.error.status) >= 0 &&
              error.error?.error?.type.search('problem\/.*([task])+') > 0) {
            self.handleTaskError(error.error.error);
          } else {
            throw error;
          }
        }
      }
    ));
    self.subscription.add(self.store.select(selectCurrentMapping).subscribe((mapping) => {
      if (mapping) {
        self.mapping = mapping;
        self.initTask();
        self.loadMemberList();
        self.initTaskTypeOptions(self.mapping);
      }
    }));
  }

  ngAfterViewInit(): void {
    const self = this;
    self.initTask();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.task = undefined;
  }

  clearError(): void {
    this.error = {};
  }


  updateSelectedRows(): void {
    if (this.mappingTableSelector && this.mappingTableSelector.selectedRows && this.task) {
      if (this.mappingTableSelector.selectedRows.length > 0) {
        if (this.mappingTableSelector.isAllSelected) {
          this.task.sourceRowSpecification = '*';
        }
        else {
          const sourceIndexes = this.mappingTableSelector.selectedRows.map(selected => selected.sourceIndex);
          this.task.sourceRowSpecification = ServiceUtils.convertNumberArrayToRangeString(sourceIndexes);
        }
      } else {
        this.assignRows = '';
        this.task.sourceRowSpecification = '';
      }
    }
  }

  initTask(): void {
    this.assignRows = '';
    if (this.mapping && this.currentUser?.id) {
      this.task = new Task('', TaskType.AUTHOR, '',
        this.mapping, this.currentUser, '', 0, '', '', false, false);
    }
  }

  loadMemberList(): void {
    if (this.mapping && this.currentUser?.id) {
      this.members = ([] as User[]).concat(this.mapping.project.owners)
        .concat(this.mapping.project.members).concat(this.mapping.project.guests);
      // @ts-ignore
      this.isMember = this.mapping.project.members.filter((u) => u.id === this.currentUser.id).length > 0;
      // @ts-ignore
      this.isOwner = this.mapping.project.owners.filter((u) => u.id === this.currentUser.id).length > 0;
    }
  }

  initTaskTypeOptions(mapping: Mapping): void {
    if (mapping.project.dualMapMode) {
      this.type_options = [TaskType.AUTHOR, TaskType.RECONCILE, TaskType.REVIEW];
    }
    else {
      this.type_options = [TaskType.AUTHOR, TaskType.REVIEW];
    }
  }

  updateDescription(dirty: boolean | null): void {
    // Default description only if none entered
    if (!dirty && this.task) {
      this.task.description = this.getDefaultDescription();
    }
  }

  setRowSelection($event: MatRadioChange, dirty: boolean | null): void {
    this.assignRows = $event.value;
    if (this.task) {
      if (this.assignRows === 'ALL') {
        this.task.sourceRowSpecification = '*';
      }
      if (this.assignRows === 'SELECTED' && this.mappingTableSelector?.selectedRows) {
        this.updateSelectedRows();
      }
      this.updateDescription(dirty);
    }
  }

  onSubmit(form: NgForm, $event: Event): void {
    const self = this;
    try {
      if (self.currentUser && self.task && form.form.valid) {
        if (self.task.assignee && self.task.assignee.id !== '') {
          self.store.dispatch(new AddTask(self.task));
          self.newTaskEvent.emit(self.task.type);
          self.mappingTableSelector?.clearAllSelectedRows();
        } else {
          throwError('TASK.ASSIGNEE_NOT_SET');
        }
      } else {
        throwError('ERROR.FORM_INVALID');
      }
    } catch (e: any) {
      self.translate.get(e).subscribe((msg) => this.error.message = msg);
    }
  }

  /**
   * Check for row conflicts on Submit
   * @param error catches 400 or 403 from API - TaskRestController
   */
  handleTaskError(error: any): void {
    this.newTaskEvent.emit('NEW'); // switch back to new task
    const dialogRef = this.dialog.open(TaskCreateComponent, {
      width: this.createTaskDialogWidth,
      data: {
        errorMessage: error,
        task: this.task,
        isOwner: this.isOwner,
      }
    });
    dialogRef.afterClosed().subscribe(
      (result: any) => {
        if (result.isCancelled) {
          this.cancelNewTaskEvent.emit();
        } else if (result.resetForm) {
          this.newTaskEvent.emit(this.task?.type);
          this.initTask();
          if (this.taskform) {
            this.taskform.reset();
          }
        } else {
          this.newTaskEvent.emit('NEW');
        }
      });
  }

  onCancel(form: NgForm, $event: Event): void {
    $event.preventDefault();
    // reset
    form.form.reset();
    this.initTask();
  }

  private getDefaultDescription(): string {
    let desc = '';
    if (this.task) {
      desc = 'TASK.' + this.task.type + '_TASK_FOR_' + this.assignRows + '_ROWS';
      this.translate.get(desc).subscribe(translatedDesc => desc = translatedDesc);
    }
    return desc;
  }

  disableSubmit(taskForm: NgForm): boolean {
    // if this is admin - valid+owner else valid
    const valid = taskForm.form.valid && this.assignRows && this.task && this.task.sourceRowSpecification;
    if (this.isAdmin) {
      return !(valid && (this.isOwner || this.isMember));
    } else {
      return !valid;
    }
  }

  compareUsers(user1: User, user2: User): boolean {
    return user1.id === user2.id && user1.email === user2.email;
  }
}
