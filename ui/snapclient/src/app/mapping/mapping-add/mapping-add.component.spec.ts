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

import {MappingAddComponent} from './mapping-add.component';
import {RouterTestingModule} from '@angular/router/testing';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../../store/app.state';
import {User} from '../../_models/user';
import {selectCurrentMapping, selectMappingError} from '../../store/mapping-feature/mapping.selectors';
import {Mapping} from '../../_models/mapping';
import {FormBuilder, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {selectCurrentUser} from '../../store/auth-feature/auth.selectors';
import {HttpLoaderFactory} from '../../app.module';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatChipsModule} from '@angular/material/chips';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ErrormessageComponent} from '../../errormessage/errormessage.component';
import {FhirService} from 'src/app/_services/fhir.service';
import {APP_CONFIG} from 'src/app/app.config';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {ProjectRolesComponent} from '../../project-roles/project-roles.component';
import {MatTableModule} from '@angular/material/table';
import {Project} from '../../_models/project';
import {selectAuthorizedProjects} from '../../store/app.selectors';

describe('MappingAddComponent', () => {
  let component: MappingAddComponent;
  let fixture: ComponentFixture<MappingAddComponent>;
  let translateService: TranslateService;
  let fhirService: FhirService;
  let store: MockStore<IAppState>;
  let el: DebugElement;

  const user = new User();
  user.givenName = 'Jo';
  user.familyName = 'Smith';

  const mapping = new Mapping();
  mapping.project = new Project();
  mapping.project.title = 'TEST';
  mapping.project.id = '1';
  mapping.project.dualMapMode = false;
  mapping.mapVersion = '1.0';
  mapping.source.id = '1';
  mapping.toVersion = 'target';
  mapping.toScope = '*';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        MatToolbarModule,
        MatCardModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatInputModule,
        MatGridListModule,
        MatChipsModule,
        MatSelectModule,
        MatCheckboxModule,
        MatSnackBarModule,
        MatTableModule,
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
        FhirService,
        provideMockStore({
          initialState: initialAppState,
          selectors: [
            {selector: selectMappingError, value: 'MockError'},
            {selector: selectCurrentMapping, value: new Mapping()},
            {selector: selectCurrentUser, value: user},
            {selector: selectAuthorizedProjects, value: [
                {
                  id: 1,
                  title: 'p1',
                  maps: [{id: '1'}]
                }]
            }
          ],
        }), {provide: MatDialogRef, useValue: {}}, {provide: MAT_DIALOG_DATA, useValue: {}},
        TranslateService],
      declarations: [MappingAddComponent, ErrormessageComponent, ProjectRolesComponent]
    }).compileComponents();
    translateService = TestBed.inject(TranslateService);
    fhirService = TestBed.inject(FhirService);
    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(MappingAddComponent);
    component = fixture.componentInstance;
    component.mode = 'FORM.CREATE';
    component.mappingModel = new Mapping();
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should have save button', () => {
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(el).toBeTruthy();
    expect(el.attributes).toBeTruthy();
  });

  it('should have a form', () => {
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('form')).nativeElement;
    expect(el).toBeTruthy();
  });

  it('form should initially be invalid', () => {
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.formGroup).toBeTruthy();
    expect(component.formGroup?.invalid).toBeTruthy();
  });

  it('form should be valid with all fields', () => {
    component.mappingModel = mapping;
    fixture.detectChanges();
    expect(component.formGroup).toBeTruthy();
    fixture.whenStable().then(() => {
      expect(component.formGroup?.valid).toBeTruthy();
    });
  });
});
