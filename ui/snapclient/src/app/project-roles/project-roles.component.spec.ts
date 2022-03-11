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

import {ProjectRolesComponent} from './project-roles.component';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {APP_CONFIG} from '../app.config';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../store/app.state';
import {HttpLoaderFactory} from '../app.module';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MatTableModule} from '@angular/material/table';
import {UserService} from '../_services/user.service';
import {MatSelectModule} from '@angular/material/select';
import {HarnessLoader} from '@angular/cdk/testing';
import {MatInputModule} from '@angular/material/input';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {MatSortModule} from '@angular/material/sort';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatSelectHarness} from '@angular/material/select/testing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {InitialsPipe} from '../_utils/initialize_pipe';

describe('ProjectRolesComponent', () => {
  let component: ProjectRolesComponent;
  let fixture: ComponentFixture<ProjectRolesComponent>;
  let translateService: TranslateService;
  let loader: HarnessLoader;
  const userService = jasmine.createSpyObj('UserService', ['getUsers']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatTableModule,
        MatSelectModule,
        MatSortModule,
        BrowserAnimationsModule,
        MatInputModule,
        // Hmm these two needed for the mat-selects to have text ??
        FormsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })
      ],
      providers: [TranslateService, {provide: APP_CONFIG, useValue: {}},
        { provide: UserService, useValue: userService },
        provideMockStore({initialState: initialAppState})],
      declarations: [ProjectRolesComponent, InitialsPipe]
    })
    .compileComponents();
    translateService = TestBed.inject(TranslateService);
    fixture = TestBed.createComponent(ProjectRolesComponent);
    component = fixture.componentInstance;
    component.translate = translateService;
    // Declare this here so onInit has a userservice object
    // This also makes sure that subscribe comes back with these values
    userService.getUsers.and.returnValue(
      of([
        {
          id: 'aaa',
          givenName: 'george',
          familyName: 'test1',
          email: 'georgetest1@gmail.com'
        },
        {
          id: 'bbb',
          givenName: 'george',
          familyName: 'test2',
          email: 'georgetest2@gmail.com'
        }
      ])
    );
  });

  beforeEach(() => {
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show users', async () => {
    // Call getusers to populate userservice
    userService.getUsers();
    fixture.detectChanges();
    const matSelect = await loader.getHarness(MatSelectHarness.with({selector: '#aaa'}));
    const selectHarness = await loader.getHarness<MatSelectHarness>(
      MatSelectHarness
    );
    expect(matSelect).toBeTruthy();
    fixture.detectChanges();
    await (await selectHarness.host()).click();
    const actual = (await selectHarness.getOptions()).length;
    expect(actual).toBe(4);
  });

});
