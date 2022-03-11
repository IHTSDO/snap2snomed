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

import {MappingDetailComponent, SourceRow} from './mapping-detail.component';
import {DebugElement} from '@angular/core';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../../store/app.state';
import {User} from '../../_models/user';
import {Mapping} from '../../_models/mapping';
import {Task, TaskType} from '../../_models/task';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpLoaderFactory} from '../../app.module';
import {APP_CONFIG} from '../../app.config';
import {selectCurrentUser} from '../../store/auth-feature/auth.selectors';
import {Source} from '../../_models/source';
import {By} from '@angular/platform-browser';
import {MatDialogModule} from '@angular/material/dialog';
import {MapRowStatus} from '../../_models/map_row';
import {MatTooltipModule} from '@angular/material/tooltip';

describe('MappingDetailComponent', () => {
  let component: MappingDetailComponent;
  let fixture: ComponentFixture<MappingDetailComponent>;
  let el: DebugElement;
  let translateService: TranslateService;
  let store: MockStore<IAppState>;

  const user = new User();
  user.givenName = 'Jo';
  const mapping = new Mapping();
  mapping.project.title = 'Test Map';
  const task = new Task('0', TaskType.AUTHOR, 'test',
    mapping, user, '1-10', 10, 'now', 'now', false, false);
  const source = new Source();
  source.id = '1';
  source.name = 'Test source codeset';
  source.version = '1.0';
  const sourceCode: SourceRow = {
    id: '0',
    index: '0',
    code: 'ABC',
    display: 'Alphabet',
    noMap: false,
    status: MapRowStatus.MAPPED
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MatDialogModule,
        MatTooltipModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })
      ],
      providers: [
        {provide: APP_CONFIG, useValue: {}},
        provideMockStore({
          initialState: initialAppState,
          selectors: [
            {selector: selectCurrentUser, value: user},
          ],
        }), TranslateService],
      declarations: [MappingDetailComponent]
    })
      .compileComponents();
    store = TestBed.inject(MockStore);
    translateService = TestBed.inject(TranslateService);
    fixture = TestBed.createComponent(MappingDetailComponent);
    component = fixture.componentInstance;
    component.task = task;
    component.source = sourceCode;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show source details in header', () => {
    el = fixture.debugElement.query(By.css('.source-table'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toContain('TABLE.SOURCE_INDEX');
  });

  it('should show source code', () => {
    el = fixture.debugElement.query(By.css('.col-main'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toContain('SOURCE.SOURCE');
    expect(el.nativeElement.textContent).toContain(sourceCode.display);
  });

  it('should show task type', () => {
    el = fixture.debugElement.query(By.css('.col-right'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toContain(task.type);
  });
});
