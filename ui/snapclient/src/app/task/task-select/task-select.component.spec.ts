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

import {TaskSelectComponent} from './task-select.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatTabsModule} from '@angular/material/tabs';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatRadioModule} from '@angular/material/radio';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../../app.module';
import {APP_CONFIG} from '../../app.config';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../../store/app.state';
import {selectTaskList} from '../../store/task-feature/task.selectors';
import {User} from '../../_models/user';
import {Mapping} from '../../_models/mapping';
import {Task, TaskType} from '../../_models/task';
import {MatSelectHarness} from '@angular/material/select/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {HarnessLoader} from '@angular/cdk/testing';
import {selectCurrentUser} from '../../store/auth-feature/auth.selectors';
import {TaskItemComponent} from '../task-item/task-item.component';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TrimPipe} from '../../_utils/trim_pipe';
import {MatIconModule} from '@angular/material/icon';
import {RouterTestingModule} from '@angular/router/testing';

describe('TaskSelectComponent', () => {
  let component: TaskSelectComponent;
  let fixture: ComponentFixture<TaskSelectComponent>;
  let translateService: TranslateService;
  let store: MockStore<IAppState>;
  let loader: HarnessLoader;

  const user = new User();
  user.givenName = 'Jo';
  user.familyName = 'Smith';

  const mapping = new Mapping();
  mapping.project.title = 'Test Map';
  const task = new Task('1', TaskType.AUTHOR, '',
    mapping, user, '1-10', 10, '', '', false, false);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatTabsModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatRadioModule,
        ReactiveFormsModule,
        MatTooltipModule,
        MatIconModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })
      ],
      providers: [TranslateService,
        {provide: APP_CONFIG, useValue: {}},
        provideMockStore({
          initialState: initialAppState,
          selectors: [
            {selector: selectCurrentUser, value: user},
            {selector: selectTaskList, value: [task]},
          ]
        })
      ],
      declarations: [TaskSelectComponent, TaskItemComponent, TrimPipe]
    })
      .compileComponents();
    store = TestBed.inject(MockStore);
    translateService = TestBed.inject(TranslateService);
    fixture = TestBed.createComponent(TaskSelectComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show dropdown', async () => {
    const matSelect = await loader.getHarness(MatSelectHarness.with({selector: '#task-select-dropdown'}));
    expect(matSelect).toBeTruthy();
  });

  it('should set current user task', () => {
    component.selectedTask = task;
    component.myTasks = [task];
    fixture.detectChanges();
    expect(component.selectedTask.assignee.id).toEqual(task.assignee.id);
  });
});
