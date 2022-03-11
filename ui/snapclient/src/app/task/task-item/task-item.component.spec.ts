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

import {TaskItemComponent} from './task-item.component';
import {User} from '../../_models/user';
import {Mapping} from '../../_models/mapping';
import {Task, TaskType} from '../../_models/task';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../../app.module';
import {APP_CONFIG} from '../../app.config';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../../store/app.state';
import {TrimPipe} from '../../_utils/trim_pipe';
import {DebugElement} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {By} from '@angular/platform-browser';
import {MatTooltipModule} from '@angular/material/tooltip';

describe('TaskItemComponent', () => {
  let component: TaskItemComponent;
  let fixture: ComponentFixture<TaskItemComponent>;
  let translateService: TranslateService;
  let store: MockStore<IAppState>;
  let el: DebugElement;

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
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatIconModule,
        MatTooltipModule,
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
        })
      ],
      declarations: [TaskItemComponent, TrimPipe]
    })
      .compileComponents();
    store = TestBed.inject(MockStore);
    translateService = TestBed.inject(TranslateService);
    fixture = TestBed.createComponent(TaskItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should create if task is defined', () => {
    component.task = task;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show Author icon if task is AUTHOR', async () => {
    component.task = task;
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('.mat-icon'));
    expect(el.nativeElement.textContent).toBe('edit');
  });

});
