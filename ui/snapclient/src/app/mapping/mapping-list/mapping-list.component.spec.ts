/*
 * Copyright © 2026 SNOMED International
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

import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';

import {MappingListComponent} from './mapping-list.component';
import {RouterTestingModule} from '@angular/router/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
import {MatTableModule} from "@angular/material/table";
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatFormFieldModule, MatLabel} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatBadgeModule} from '@angular/material/badge';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ProjectBadgesComponent} from '../../project-badges/project-badges.component';
import {UserChipComponent} from '../../user/user-chip/user-chip.component';
import {GravatarComponent} from '../../user/gravatar/gravatar.component';

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
    declarations: [
        MappingListComponent,
        InitialsPipe,
        LastupdatedPipe,
        ErrormessageComponent,
        ProjectBadgesComponent,
        UserChipComponent,
        GravatarComponent
    ],
    imports: [RouterTestingModule,
        MatButtonModule,
        MatDialogModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        MatTableModule,
        MatToolbarModule,
        MatCardModule,
        MatChipsModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        MatSidenavModule,
        MatFormFieldModule,
        MatInputModule,
        MatLabel,
        MatSelectModule,
        MatPaginatorModule,
        MatBadgeModule,
        MatTooltipModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory
            }
        })],
    providers: [
        { provide: APP_CONFIG, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        provideMockStore({
            initialState: initialAppState,
            selectors: [
                { selector: selectMappingError, value: 'MockError' },
                { selector: selectCurrentMapping, value: new Mapping() },
                { selector: selectCurrentUser, value: user },
            ],
        }), TranslateService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
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
    el = fixture.debugElement.query(By.css('.no-maps-message'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toContain('MAP.NO_MAPS_FOUND');
  });

  it('should show project list if projects', () => {
    const project = new Project();
    project.title = 'Test Project';
    component.projects = [project];
    component.dataSource.data = [project];
    fixture.detectChanges();
    let tableRows = fixture.nativeElement.querySelectorAll('tr');
    expect(tableRows.length).toBe(2);

    let headerRow = tableRows[0];
    expect(headerRow.cells[0].textContent).toBe('PROJECT_TABLE.TITLE');

    let row = tableRows[1];
    expect(row.cells[0].textContent).toBe('Test Project');
  });

  it('should clear the error message once the store error resolves to null', () => {
    component.error = {message: 'Some error'};

    store.overrideSelector(selectMappingError, null);
    store.refreshState();

    expect(component.error).toEqual({});
  });

  it('should reset to the first page when the text filter changes', fakeAsync(() => {
    component.currentPage = 5;

    component.applyFilter({target: {value: 'test'}} as unknown as Event);
    tick(200);

    expect(component.currentPage).toBe(0);
  }));

  it('should reset to the first page when the role filter changes', fakeAsync(() => {
    component.currentPage = 5;

    component.applyRoleFilter({value: 'owner'} as unknown as MatSelectChange);
    tick(200);

    expect(component.currentPage).toBe(0);
  }));

  it('should reset to the first page when the text filter is cleared', fakeAsync(() => {
    component.currentPage = 5;

    component.clearInput(document.createElement('input'));
    tick(200);

    expect(component.currentPage).toBe(0);
  }));

});
