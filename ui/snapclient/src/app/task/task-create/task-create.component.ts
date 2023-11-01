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

import {Component, EventEmitter, Inject, OnInit, Output} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {throwError} from 'rxjs';
import {ErrorInfo} from 'src/app/errormessage/errormessage.component';
import {TaskConflictType, TaskType} from 'src/app/_models/task';
import {IAppState} from '../../store/app.state';
import {AddTask} from '../../store/task-feature/task.actions';


interface ErrorDetails {
  specification: string;
  count: number;
}

interface ErrorMessage {
  indexSpecificationWithAllConflictsRemoved: ErrorDetails;
  indexSpecificationWithExistingTaskConflictsRemoved: ErrorDetails;
  indexSpecificationWithRoleConflictsRemoved: ErrorDetails;
  indexesWithExistingTask: ErrorDetails;
  indexesWithRoleConflict: ErrorDetails;
  originalIndexSpecification: ErrorDetails;
  indexCountWithRoleConflict: number;
  indexCountWithExistingTaskConflict: number;
  indexCountWithRoleAndExistingTaskConflict: number;
  status: number;
  title: string;
  type: string;
}

@Component({
  selector: 'app-task-create',
  templateUrl: './task-create.component.html',
  styleUrls: ['./task-create.component.css']
})
export class TaskCreateComponent implements OnInit {

  error: ErrorInfo = {};
  errorDetails: ErrorDetails = {
    specification: '',
    count: 0
  };
  errorMessage: ErrorMessage = {
    indexSpecificationWithAllConflictsRemoved: this.errorDetails,
    indexSpecificationWithExistingTaskConflictsRemoved: this.errorDetails,
    indexSpecificationWithRoleConflictsRemoved: this.errorDetails,
    indexesWithExistingTask: this.errorDetails,
    indexesWithRoleConflict: this.errorDetails,
    originalIndexSpecification: this.errorDetails,
    indexCountWithRoleConflict: 0,
    indexCountWithExistingTaskConflict: 0,
    indexCountWithRoleAndExistingTaskConflict: 0,
    status: 0,
    title: '',
    type: ''
  };
  existingConflicts = 0;
  roleConflicts = 0;
  existingAndRoleConflicts = 0;

  constructor(private store: Store<IAppState>,
              public translate: TranslateService,
              public dialogRef: MatDialogRef<TaskCreateComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    dialogRef.disableClose = true;
  }

  ngOnInit(): void {
    this.existingConflicts = this.getConflictCount('EXISTING');
    this.roleConflicts = this.getConflictCount('ROLE');
    this.existingAndRoleConflicts = this.getConflictCount('EXISTING_AND_ROLE');
  }

  onCancel(doReset: boolean, isCancelled: boolean): void {
    const theForm = this.data.form;
    this.data.task.allowAssigneeToBeAuthorAndReviewer = false;
    this.data.task.reassignAlreadyAssignedRows = false;
    this.dialogRef.close({resetForm: doReset, isCancelled: isCancelled, form: theForm});
  }

  handleTaskError(errorDetail: ErrorMessage | undefined): void {
    if (errorDetail) {
      this.data.errorMessage = errorDetail;
    }
  }

  getTaskOppositeType(): string {
    let type = '';
    switch (this.data.task.type) {
      // Note Opposite offending task
      case TaskType.RECONCILE:
        this.translate.get('TASK.TYPE_RECONCILE').subscribe((msg) => type = msg);
        break;
      case TaskType.REVIEW:
        this.translate.get('TASK.TYPE_AUTHOR').subscribe((msg) => type = msg);
        break;
      case TaskType.AUTHOR:
        this.translate.get('TASK.TYPE_REVIEW').subscribe((msg) => type = msg);
        break;
      default:
        this.translate.get('TASK.TYPE_UNKNOWN').subscribe((msg) => type = msg);
        break;
    }
    return type;
  }

  onCreateAnyway(): void {
    this.data.task.sourceRowSpecification = this.data.errorMessage.indexSpecificationWithAllConflictsRemoved.specification;
    this.createTaskCall();
    this.onCancel(true, false);
  }

  onCreateWithOverride(): void {
    this.data.task.sourceRowSpecification = '';
    if (this.data.task.allowAssigneeToBeAuthorAndReviewer && this.data.task.reassignAlreadyAssignedRows) {
      this.data.task.sourceRowSpecification = this.data.errorMessage.originalIndexSpecification.specification;
    } else if (this.data.task.reassignAlreadyAssignedRows) {
      this.data.task.sourceRowSpecification = this.data.errorMessage.indexSpecificationWithRoleConflictsRemoved.specification;
    } else if (this.data.task.allowAssigneeToBeAuthorAndReviewer) {
      this.data.task.sourceRowSpecification = this.data.errorMessage.indexSpecificationWithExistingTaskConflictsRemoved.specification;
    } else {
      this.data.task.sourceRowSpecification = this.data.errorMessage.indexSpecificationWithAllConflictsRemoved.count;
    }
    if (this.data.task.sourceRowSpecification.indexOf('*') !== -1) {
      this.data.task.sourceRowSpecification = '*';
    }
    this.createTaskCall();
    this.onCancel(true, false);
  }

  createTaskCall(): void {
    if (this.data.task) {
      if (this.data.task.assignee && this.data.task.assignee.id !== '') {
        this.store.dispatch(new AddTask(this.data.task));
      } else {
        throwError('TASK.ASSIGNEE_NOT_SET');
      }
    } else {
      throwError('ERROR.FORM_INVALID');
    }
  }

  calculateRowCountToCreate(): number {
    if (this.data.task.allowAssigneeToBeAuthorAndReviewer && this.data.task.reassignAlreadyAssignedRows) {
      return this.data.errorMessage.originalIndexSpecification.count;
    } else if (this.data.task.reassignAlreadyAssignedRows) {
      return this.data.errorMessage.indexSpecificationWithRoleConflictsRemoved.count;
    } else if (this.data.task.allowAssigneeToBeAuthorAndReviewer) {
      return this.data.errorMessage.indexSpecificationWithExistingTaskConflictsRemoved.count;
    } else {
      return this.data.errorMessage.indexSpecificationWithAllConflictsRemoved.count ?? 0;
    }
  }

  calculateOverriddenCount(): number {
    if (this.data.task.allowAssigneeToBeAuthorAndReviewer && this.data.task.reassignAlreadyAssignedRows) {
      return this.data.errorMessage.indexCountWithRoleConflict + this.data.errorMessage.indexCountWithExistingTaskConflict
        - this.data.errorMessage.indexCountWithRoleAndExistingTaskConflict;
    } else if (this.data.task.reassignAlreadyAssignedRows) {
      return this.data.errorMessage.indexCountWithExistingTaskConflict;
    } else if (this.data.task.allowAssigneeToBeAuthorAndReviewer) {
      return this.data.errorMessage.indexCountWithRoleConflict;
    } else {
      return 0;
    }
  }

  calculateSkippedCount(): number {
    if (this.data.task.allowAssigneeToBeAuthorAndReviewer && this.data.task.reassignAlreadyAssignedRows) {
      return 0;
    } else if (this.data.task.reassignAlreadyAssignedRows) {
      return this.data.errorMessage.indexCountWithRoleConflict;
    } else if (this.data.task.allowAssigneeToBeAuthorAndReviewer) {
      return this.data.errorMessage.indexCountWithExistingTaskConflict;
    } else {
      return this.data.errorMessage.originalIndexSpecification.count -
        this.data.errorMessage.indexSpecificationWithAllConflictsRemoved.count;
    }
  }

  getConflictCount(conflictType: TaskConflictType | string): number {
    let rtn = 0;
    if (this.data.errorMessage) {
      switch (conflictType) {
        case TaskConflictType.EXISTING:
          rtn = this.data.errorMessage.indexesWithExistingTask ? this.data.errorMessage.indexesWithExistingTask.count : 0;
          break;
        case TaskConflictType.ROLE:
          rtn = this.data.errorMessage.indexesWithRoleConflict ? this.data.errorMessage.indexesWithRoleConflict.count : 0;
          break;
        case TaskConflictType.EXISTING_AND_ROLE:
          rtn = this.data.errorMessage.indexCountWithRoleAndExistingTaskConflict ?
            this.data.errorMessage.indexCountWithRoleAndExistingTaskConflict.count : 0;
          break;
      }
    }
    return rtn;
  }

  hasConflicts(conflictType: TaskConflictType | string): boolean {
    return this.getConflictCount(conflictType) > 0;
  }


}
