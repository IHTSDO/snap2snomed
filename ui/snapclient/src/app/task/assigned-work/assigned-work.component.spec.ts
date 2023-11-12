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
import {By} from '@angular/platform-browser';
import {MatTabsModule} from '@angular/material/tabs';
import {AssignedWorkComponent} from './assigned-work.component';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {HttpLoaderFactory} from '../../app.module';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../../store/app.state';
import {selectTaskList, selectTaskSaveError} from '../../store/task-feature/task.selectors';
import {Task, TaskType} from '../../_models/task';
import {APP_CONFIG} from '../../app.config';
import {User} from '../../_models/user';
import {Mapping} from '../../_models/mapping';
import {InitialsPipe} from '../../_utils/initialize_pipe';
import {ErrormessageComponent} from '../../errormessage/errormessage.component';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';

describe('AssignedWorkComponent', () => {
  let component: AssignedWorkComponent;
  let fixture: ComponentFixture<AssignedWorkComponent>;
  let translateService: TranslateService;
  let store: MockStore<IAppState>;

  const user = new User();
  user.givenName = 'Jo';

  const mapping = new Mapping();
  mapping.project.title = 'Test Map';
  const task = new Task('1', TaskType.AUTHOR, 'test', mapping, user, '1-10', 10, '', '', false, false);

  const expectedTabLabels = ['add_taskTASK.ADD_TASK', 'editTASK.TAB_AUTHOR', 'checklistTASK.TAB_REVIEW', 'compare_arrowsTASK.TAB_RECONCILE'];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        MatTabsModule,
        MatTooltipModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })
      ],
      declarations: [
        AssignedWorkComponent,
        InitialsPipe,
        ErrormessageComponent
      ],
      providers: [TranslateService,
        {provide: APP_CONFIG, useValue: {}},
        provideMockStore({
          initialState: initialAppState,
          selectors: [
            {selector: selectTaskSaveError, value: 'MockError'},
            {selector: selectTaskList, value: [task]},
          ]
        })
      ]
    })
      .compileComponents();
    store = TestBed.inject(MockStore);
    translateService = TestBed.inject(TranslateService);
    fixture = TestBed.createComponent(AssignedWorkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('tabs should show expected content', () => {
    fixture.whenRenderingDone().then(() => {
      const tabLabels = document.querySelectorAll(
        '.mat-tab-label-content'
      );
      Array.from(tabLabels).forEach(element => {
        if (element !== null) {
          expect(expectedTabLabels).toContain(element.textContent || '');
        }
      });
    });
  });

  it('should show load error', () => {
    component.error.message = 'TASK.FAILED_TO_LOAD_TASKS';
    fixture.detectChanges();
    const error = fixture.debugElement.query(By.css('.alert'));
    expect(error).toBeTruthy();
    expect(error.nativeElement.textContent).toContain('TASK.FAILED_TO_LOAD_TASKS');
  });

});
