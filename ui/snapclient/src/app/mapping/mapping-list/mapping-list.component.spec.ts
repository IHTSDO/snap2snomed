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

import {MappingListComponent} from './mapping-list.component';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../../app.module';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../../store/app.state';
import {selectCurrentMapping, selectMappingError} from '../../store/mapping-feature/mapping.selectors';
import {Mapping} from '../../_models/mapping';
import {selectCurrentUser} from '../../store/auth-feature/auth.selectors';
import {DebugElement} from '@angular/core';
import {User} from '../../_models/user';
import {By} from '@angular/platform-browser';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatCardModule} from '@angular/material/card';
import {Project} from '../../_models/project';
import {InitialsPipe} from '../../_utils/initialize_pipe';
import {LastupdatedPipe} from '../../_utils/lastupdated_pipe';
import {ErrormessageComponent} from '../../errormessage/errormessage.component';
import {MatChipsModule} from '@angular/material/chips';
import {APP_CONFIG} from '../../app.config';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('MappingListComponent', () => {
  let component: MappingListComponent;
  let fixture: ComponentFixture<MappingListComponent>;
  let translateService: TranslateService;
  let store: MockStore<IAppState>;
  let el: DebugElement;

  const user = new User();
  user.givenName = 'Jo';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        MatButtonModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        MatToolbarModule,
        MatCardModule,
        MatChipsModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })
      ],
      providers: [
        { provide: APP_CONFIG, useValue: {} },
        provideMockStore({
        initialState: initialAppState,
        selectors: [
          {selector: selectMappingError, value: 'MockError'},
          {selector: selectCurrentMapping, value: new Mapping()},
          {selector: selectCurrentUser, value: user},
        ],
      }), TranslateService],
      declarations: [
        MappingListComponent,
        InitialsPipe,
        LastupdatedPipe,
        ErrormessageComponent]
    }).compileComponents();
    translateService = TestBed.inject(TranslateService);
    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(MappingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should show CREATE MAP button', () => {
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('button'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toBe('MAP.MAP_ADD');
  });

  it('should show NO RESULTS if no projects', () => {
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('mat-card-title'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toBe('info MAP.NO_MAPS_FOUND');
  });

  it('should show project list if projects', () => {
    const project = new Project();
    project.title = 'Test Project';
    component.projects = [project];
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('mat-card h2'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toBe('Test Project');
  });

});
