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

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TaskCreateComponent} from './task-create.component';
import {By} from '@angular/platform-browser';
import {Task, TaskType} from '../../_models/task';
import {User} from '../../_models/user';
import {Mapping} from '../../_models/mapping';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {ScannedActionsSubject} from '@ngrx/store';
import {APP_CONFIG} from '../../app.config';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../../store/app.state';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {HttpLoaderFactory} from '../../app.module';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatRadioModule} from '@angular/material/radio';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';

describe('TaskCreateComponent', () => {
  let component: TaskCreateComponent;
  let fixture: ComponentFixture<TaskCreateComponent>;

  const user = new User();
  user.givenName = 'Jo';
  user.familyName = 'Smith';

  const mapping = new Mapping();
  mapping.project.title = 'Test Map';
  const task = new Task('1', TaskType.AUTHOR, '',
    mapping, user, '1-10', 10, '', '', true, true);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatSnackBarModule,
        MatSlideToggleModule,
        MatRadioModule,
        MatDialogModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })
      ],
      providers: [TranslateService, ScannedActionsSubject,
        {provide: MatDialogRef, useValue: {}},
        {provide: MAT_DIALOG_DATA, useValue: {}},
        {provide: APP_CONFIG, useValue: {}},
        provideMockStore({
          initialState: initialAppState
        })
      ],
      declarations: [TaskCreateComponent]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskCreateComponent);
    component = fixture.componentInstance;
    component.data.task = task;
    component.data.isOwner = true;
    component.data.errorMessage =
      {
        "indexesWithExistingTask": {"specification": "1-5", "count": 5},
        "indexesWithRoleConflict": {"specification": "1-5,8-10", "count": 8},
        "originalIndexSpecification": {"specification": "*", "count": 13},
        "indexSpecificationWithRoleConflictsRemoved": {"specification": "6-7,11-13", "count": 4},
        "indexSpecificationWithExistingTaskConflictsRemoved": {"specification": "6-13", "count": 7},
        "indexSpecificationWithAllConflictsRemoved": {"specification": "6-7,11-13", "count": 4},
        "indexCountWithRoleConflict": 8,
        "indexCountWithExistingTaskConflict": 5,
        "indexCountWithRoleAndExistingTaskConflict": 5,
        "type": "http://snap2snomed.app/problem/task-specification-containse-unassignable-rows",
        "title": "Task row specification contains rows which cannot be assigned to a task by this user",
        "status": 400
      }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show sliders if its owner', () => {
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.assign-select')).nativeElement;
    expect(el).toBeTruthy();
  });

  it('should not show sliders if its member', () => {
    component.data.task = task;
    component.data.isOwner = false;
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.assign-select'));
    expect(el).toBeFalsy();
  });
});
