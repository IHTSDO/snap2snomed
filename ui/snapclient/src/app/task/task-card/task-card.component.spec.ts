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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {DebugElement} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {InitialsPipe} from 'src/app/_utils/initialize_pipe';
import {HttpLoaderFactory} from '../../app.module';
import {Mapping} from '../../_models/mapping';
import {Task, TaskType} from '../../_models/task';
import {User} from '../../_models/user';
import {TaskCardComponent} from './task-card.component';
import {APP_CONFIG} from '../../app.config';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../../store/app.state';
import {selectTaskSaveError} from '../../store/task-feature/task.selectors';
import {ErrormessageComponent} from '../../errormessage/errormessage.component';
import {MatCheckbox, MatCheckboxModule} from '@angular/material/checkbox';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatChipsModule} from '@angular/material/chips';
import {selectCurrentUser} from '../../store/auth-feature/auth.selectors';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {RouterTestingModule} from '@angular/router/testing';
import {UserChipComponent} from '../../user/user-chip/user-chip.component';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {ScannedActionsSubject} from '@ngrx/store';
import {MatDialogModule} from '@angular/material/dialog';

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;
  let store: MockStore<IAppState>;
  let el: DebugElement;
  let translateService: TranslateService;

  const user = new User();
  user.givenName = 'Jo';
  const mapping = new Mapping();
  mapping.project.title = 'Test Map';
  const theTask = new Task('1', TaskType.AUTHOR, 'test2', mapping, user, '1-10', 10, '', '', false, false);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        }),
        HttpClientTestingModule,
        MatCheckboxModule,
        MatIconModule,
        MatCardModule,
        MatDividerModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        MatChipsModule,
        MatTooltipModule,
        MatProgressBarModule,
        MatDialogModule
      ],
      providers: [TranslateService, ScannedActionsSubject,
        {provide: APP_CONFIG, useValue: {}},
        provideMockStore({
          initialState: initialAppState,
          selectors: [
            {selector: selectTaskSaveError, value: {task: {id: '1'}, error: 'taskError'}},
            {selector: selectCurrentUser, value: user},
          ]
        }),
        HttpClientTestingModule],
      declarations: [TaskCardComponent, InitialsPipe, ErrormessageComponent, MatCheckbox, UserChipComponent]
    })
      .compileComponents();
    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(TaskCardComponent);
    translateService = TestBed.inject(TranslateService);
    component = fixture.componentInstance;
    component.task = theTask;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not contain tasks when null passed', () => {
    component.task = null;
    fixture.detectChanges();
    expect(component.task).toBeFalsy();
  });

  it('should contain tasks when string passed', () => {
    const newTask = new Task('1', TaskType.AUTHOR, 'testtask', mapping, user, '1-10', 10,
      'now', 'now', false, false);
    component.task = newTask;
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('.task-card'));
    expect(el).toBeTruthy();
  });

});
