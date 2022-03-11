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

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {User} from 'src/app/_models/user';
import {IndexSpecification, Task} from 'src/app/_models/task';
import {selectCurrentUser} from '../../store/auth-feature/auth.selectors';
import {ScannedActionsSubject, Store} from '@ngrx/store';
import {IAppState} from '../../store/app.state';
import {Subscription} from 'rxjs';
import {ErrorInfo, ErrormessageComponent} from 'src/app/errormessage/errormessage.component';
import {Router} from '@angular/router';
import {selectTaskDeleteError} from '../../store/task-feature/task.selectors';
import {CompleteTask, DeleteTask} from '../../store/task-feature/task.actions';
import {TaskService} from '../../_services/task.service';
import {ConfirmDialogComponent, DialogType} from '../../dialog/confirm-dialog/confirm-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {AuthService} from '../../_services/auth.service';
import {debounceTime} from "rxjs/operators";

export enum TaskAction {
  COMPLETE = 'COMPLETE',
  CANCEL = 'CANCEL'
}

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.css']
})
export class TaskCardComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() task: Task | null | undefined;
  @Input() currentUser: User | null | undefined;
  @Input() isClickable: boolean | null | undefined;
  @Input() isOwner: boolean | null | undefined;
  @Output() updateTaskEvent = new EventEmitter<string>();

  // @ts-ignore
  @ViewChild('taskcard', {static: false}) taskCard: ElementRef;

  // @ts-ignore
  @ViewChild('errorMessage', {static: false}) errorMessageDialog: ErrormessageComponent;

  error: ErrorInfo = {};
  private subscription = new Subscription();
  taskAction?: TaskAction;
  taskActions = TaskAction;
  incompleteRows?: IndexSpecification;
  percentComplete: any = 0;
  confirmCompleteTitle = '';
  confirmCompleteMessage = '';
  confirmDeleteTitle = '';
  confirmDeleteMessage = '';
  savedOK = '';
  cancel = '';
  isAdmin = false;
  // tslint:disable-next-line:variable-name
  constructor(public _elementRef: ElementRef<HTMLElement>,
              private router: Router,
              private translate: TranslateService,
              private store: Store<IAppState>,
              private taskService: TaskService,
              private authService: AuthService,
              private actions: ScannedActionsSubject,
              public dialog: MatDialog) {
    this.translate.get('DIALOG.OK').subscribe((msg) => this.savedOK = msg);
    this.translate.get('DIALOG.CANCEL').subscribe((msg) => this.cancel = msg);
    this.translate.get('TASK.COMPLETE_TASK_TITLE').subscribe((msg) =>
      this.confirmCompleteTitle = msg);
    this.translate.get('TASK.COMPLETE_TASK_CONFIRM_MESSAGE').subscribe((msg) =>
      this.confirmCompleteMessage = msg);
    this.translate.get('TASK.CANCEL_TASK_TITLE').subscribe((msg) =>
      this.confirmDeleteTitle = msg);
    this.translate.get('TASK.CANCEL_TASK_CONFIRM_MESSAGE').subscribe((msg) =>
      this.confirmDeleteMessage = msg);
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.store.select(selectTaskDeleteError).subscribe((error) => {
      if (error != null) {
        this.translate.get('ERROR.CANCEL_OR_COMPLETE_TASK').subscribe((err) => {
          this.error.message = err;
          this.error.detail = error.error;
        });
      }
    });
    if (!this.currentUser) {
      this.store.select(selectCurrentUser).subscribe((user) => this.currentUser = user);
    }
    if (this.task) {
      this.subscription.add(this.taskService.getIncompleteRowSpecification(this.task.id).subscribe(
        (incomplete: any) => {
          this.incompleteRows = incomplete as IndexSpecification;
          const totalRows = this.task?.sourceRowCount ? parseInt(this.task.sourceRowCount.toString(), 10) : 0;
          if (totalRows > 0) {
            this.percentComplete = 100 * ( totalRows - incomplete.count) / totalRows;
          }
        },
        (err) => this.translate.get('ERROR.UNABLE_TO_GET_INCOMPLETE_ROW_COUNT_FOR_TASK', {task: this.task?.id}).subscribe((msg) => {
          this.error.message = msg;
          this.error.detail = err.error;
        })
      ));
    }
  }

  ngAfterViewInit(): void {
    if (this.isClickable) {
      if (this.taskCard) {
        this._elementRef.nativeElement.querySelectorAll('.mat-card').forEach(
          element => {
            element.classList.add('clickable');
          });
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  taskMapping(): void {
    if (this.isClickable && this.task && !this.taskAction
    ) {
      this.router.navigate(['map-view', this.task.mapping.id, 'map-work', this.task.id], {replaceUrl: false});
    }
  }

  confirmAction(): void {
    if (this.task) {
      if (this.isOwner && this.taskAction === TaskAction.CANCEL) {
        this.store.dispatch(new DeleteTask(this.task));
      } else {
        this.store.dispatch(new CompleteTask(this.task));
      }
      this.updateTaskEvent.emit(this.task.type);
      this.taskAction = undefined;
    }
  }

  onCompleteTask($event: MouseEvent, taskAction: TaskAction | string): void {
    $event.stopPropagation();
    const self = this;
    self.taskAction = taskAction === TaskAction.COMPLETE ? TaskAction.COMPLETE : TaskAction.CANCEL;
    const confirmDialogRef = self.dialog.open(ConfirmDialogComponent, {
      data: {
        title: taskAction === TaskAction.COMPLETE ? self.confirmCompleteTitle : self.confirmDeleteTitle,
        subtitle: `${self.task?.description} (${self.task?.sourceRowSpecification})`,
        message: taskAction === TaskAction.COMPLETE ? self.confirmCompleteMessage : self.confirmDeleteMessage,
        button: self.savedOK,
        cancel: self.cancel,
        type: DialogType.CONFIRM
      }
    });
    const component = confirmDialogRef.componentInstance
    component.isFixedSize = true;
    confirmDialogRef.afterClosed().subscribe(
      (ok: boolean) => {
        if (ok) {
          self.confirmAction();
        } else {
          self.taskAction = undefined;
        }
      });
  }

  onCancelTask($event: MouseEvent): void {
    $event.stopPropagation();
    this.taskAction = this.taskActions.CANCEL;
  }

  isAssigned(task: Task): boolean {
    return this.currentUser?.id === task.assignee.id;
  }

  rounded(percentComplete: any): number {
    if (percentComplete && typeof percentComplete === 'number') {
      return Math.round(percentComplete);
    }
    return 0;
  }
}
