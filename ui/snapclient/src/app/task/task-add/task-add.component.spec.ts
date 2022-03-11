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

import {ComponentFixture, fakeAsync, flush, TestBed} from '@angular/core/testing';

import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatTabsModule} from '@angular/material/tabs';
import {HttpLoaderFactory} from '../../app.module';
import {APP_CONFIG} from '../../app.config';
import {IAppState, initialAppState} from '../../store/app.state';
import {selectTaskList, selectTaskSaveError} from '../../store/task-feature/task.selectors';
import {By} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TaskAddComponent} from './task-add.component';
import {User} from '../../_models/user';
import {Mapping} from '../../_models/mapping';
import {Task, TaskType} from '../../_models/task';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatRadioModule} from '@angular/material/radio';
import {ErrormessageComponent} from '../../errormessage/errormessage.component';
import {MatCardModule} from '@angular/material/card';
import {MatSelectHarness} from '@angular/material/select/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {HarnessLoader} from '@angular/cdk/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {ScannedActionsSubject} from '@ngrx/store';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { MappingTableSelectorComponent } from 'src/app/mapping/mapping-table-selector/mapping-table-selector.component';
import {InitialsPipe} from '../../_utils/initialize_pipe';

describe('TaskAddComponent', () => {
  let component: TaskAddComponent;
  let fixture: ComponentFixture<TaskAddComponent>;
  let translateService: TranslateService;
  let store: MockStore<IAppState>;
  let loader: HarnessLoader;

  const user = new User();
  user.id = 'abcdef';
  user.givenName = 'Jo';
  user.familyName = 'Smith';

  const mapping = new Mapping();
  mapping.project.title = 'Test Map';
  const task = new Task('1', TaskType.AUTHOR, '',
    mapping, user, '1-10', 10, '', '', false, false);


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
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
        MatSnackBarModule,
        MatSlideToggleModule,
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
          initialState: initialAppState,
          selectors: [
            {selector: selectTaskList, value: [task]},
          ]
        })
      ],
      declarations: [TaskAddComponent, ErrormessageComponent, MappingTableSelectorComponent, InitialsPipe]
    })
      .compileComponents();
    store = TestBed.inject(MockStore);
    translateService = TestBed.inject(TranslateService);
    fixture = TestBed.createComponent(TaskAddComponent);
    component = fixture.componentInstance;
    component.translate = translateService;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not create form if task is null', () => {
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('form'));
    expect(el).toBeFalsy();
  });

  it('should create form if task is set', () => {
    component.task = task;
    component.isMember = true;
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('form')).nativeElement;
    expect(el).toBeTruthy();
  });

  it('should create cancel button', () => {
    component.task = task;
    component.isMember = true;
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('button[type="cancel"]')).nativeElement;
    expect(el).toBeTruthy();
  });

  it('should show submit button when valid', () => {
    component.task = task;
    component.isMember = true;
    component.assignRows = 'ALL';
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(el).toBeTruthy();
  });

  it('should show rows selected if SELECTED option', () => {
    component.task = task;
    component.isMember = true;
    component.assignRows = 'SELECTED';
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.selected-rows')).nativeElement;
    expect(el).toBeTruthy();

  });

  it('should set default assignee in dropdown', async () => {
    component.task = task;
    component.currentUser = user;
    component.members = [user];
    component.isMember = true;
    component.isOwner = true;

    fixture.detectChanges();
    expect(component.task?.assignee.id).toEqual(component.currentUser.id);
    const matSelect = await loader.getHarness(MatSelectHarness.with({selector: '#assignee'}));
    expect(matSelect).toBeTruthy();
    // Click the select element host TODO NOT WORKING
    // await (await matSelect.host()).click();
    // const actual = (await matSelect.getOptions()).length;
    // expect(actual).toBe(1);
    // const text = `${user.givenName} ${user.familyName}`;
    // const defaultOption = await matSelect.getOptions({text});
    // expect(defaultOption).toBeTruthy();
  });

  it('should set default description if none', () => {
    component.task = task;
    component.isMember = true;
    fixture.detectChanges();
    expect(component.task).toBeTruthy();
    expect(component.task.description).toEqual('');
    const el = fixture.debugElement.query(By.css('#assignRows'));
    el.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.task?.description?.length).toBeGreaterThan(1);
  });
});
