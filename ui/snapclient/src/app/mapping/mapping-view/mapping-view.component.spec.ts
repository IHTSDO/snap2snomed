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

import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick, waitForAsync } from '@angular/core/testing';
import { MappingViewComponent } from './mapping-view.component';
import { TranslateLoader, TranslateModule, TranslateService, TranslateFakeLoader } from '@ngx-translate/core';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAppState } from '../../store/app.state';
import { DebugElement, NO_ERRORS_SCHEMA } from '@angular/core';
import { User } from '../../_models/user';
import { MapService } from '../../_services/map.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { selectCurrentMapping, selectCurrentView, selectMappingError, selectMappingLoading, selectSelectedRows } from '../../store/mapping-feature/mapping.selectors';
import { selectCurrentUser } from '../../store/auth-feature/auth.selectors';
import { selectMappingFile, selectMappingFileError, selectMappingFileLoading, selectMappingFileSuccess } from '../../store/source-feature/source.selectors';
import { selectTaskList } from '../../store/task-feature/task.selectors';
import { Mapping } from '../../_models/mapping';
import { Page } from '../../_models/map_row';

import { InitialsPipe } from '../../_utils/initialize_pipe';
import { LastupdatedPipe } from '../../_utils/lastupdated_pipe';
import { ErrormessageComponent } from '../../errormessage/errormessage.component';
import { BulkchangeComponent } from '../bulkchange/bulkchange.component';
import { MappingTableSelectorComponent } from '../mapping-table-selector/mapping-table-selector.component';
import { MappingDetailsCardComponent } from '../mapping-details-card/mapping-details-card.component';
import { APP_CONFIG } from '../../app.config';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';

describe('MappingViewComponent', () => {
  let component: MappingViewComponent;
  let fixture: ComponentFixture<MappingViewComponent>;
  let el: DebugElement;

  const user = new User();
  user.givenName = 'Jo';

  const mapping = new Mapping();
  mapping.id = '1';
  mapping.project.title = 'Test Map';

  const mockMapService = {
    getTagCount: () => of({ page: { totalElements: 0 } })
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        MappingViewComponent,
        InitialsPipe,
        LastupdatedPipe,
        ErrormessageComponent,
        BulkchangeComponent,
        MappingDetailsCardComponent,
        MappingTableSelectorComponent
      ],
      imports: [
        MatSortModule,
        MatPaginatorModule,
        MatButtonModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        MatToolbarModule,
        MatCardModule,
        MatChipsModule,
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSidenavModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        MatTooltipModule,
        FormsModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        MatDialogModule,
        MatBottomSheetModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader
          }
        })
      ],
      providers: [
        provideRouter([{ path: 'map-view/:id', component: MappingViewComponent }]),
        { provide: APP_CONFIG, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ mappingid: mapping.id }),
            queryParams: of({})
          }
        },
        { provide: MapService, useValue: mockMapService },
        provideMockStore({
          initialState: initialAppState,
          selectors: [
            { selector: selectMappingError, value: 'MockError' },
            { selector: selectCurrentMapping, value: mapping },
            { selector: selectCurrentView, value: new Page() },
            { selector: selectTaskList, value: [] },
            { selector: selectCurrentUser, value: user },
            { selector: selectSelectedRows, value: [] },
            { selector: selectMappingFile, value: null },
            { selector: selectMappingFileSuccess, value: null },
            { selector: selectMappingFileError, value: null },
            { selector: selectMappingLoading, value: false },
            { selector: selectMappingFileLoading, value: false }
          ]
        }),
        TranslateService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    // Defensive reset: clear owners in case a previous test leaked state
    mapping.project.owners = [];

    fixture = TestBed.createComponent(MappingViewComponent);
    component = fixture.componentInstance;

    component.allSourceDetails = [];
    component.currentUser = user;
    // Pre-set mapping so @if(mapping) embedded view is created in the first detectChanges
    // rather than mid-cycle during a later one — avoids NG0100 from in-flight creation
    component.mapping = mapping;

    fixture.detectChanges(); // ngOnInit, @if(mapping) view created (mapping already truthy)
    tick(201);               // fire debounceTime(200): selectCurrentMapping subscription fires
    fixture.detectChanges(); // update cycle with stable embedded view
    tick();                  // drain microtasks (ngModel, router navigation)
    fixture.detectChanges(); // settle final state
  }));

  afterEach(() => {
    selectCurrentView.clearResult();
    selectCurrentMapping.clearResult();
    selectTaskList.clearResult();
    selectMappingFile.clearResult();
    selectMappingFileSuccess.clearResult();
    selectMappingFileLoading.clearResult();
    selectMappingFileError.clearResult();
    selectMappingLoading.clearResult();
    selectMappingError.clearResult();
    selectSelectedRows.clearResult();
    fixture.destroy();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should show EDIT MAP button', () => {
    el = fixture.debugElement.query(By.css('a'));
    expect(el.nativeElement.textContent).toBe(' MAP.MAP_VIEW_BUTTON ');
    expect(el).toBeTruthy();
  });

  // Owner-only tests: recreate the component with isOwner()=true from the start so
  // @if(isOwner()) views are stable on the first detectChanges and never cause NG0100.
  describe('as owner', () => {
    beforeEach(async () => {
      fixture.destroy();
      
      // Set owners BEFORE creating fixture so @if(isOwner()) is true on initial render
      mapping.project.owners = [user];

      fixture = TestBed.createComponent(MappingViewComponent);
      component = fixture.componentInstance;

      component.allSourceDetails = [];
      component.mapping = mapping;
      component.currentUser = user;

      fixture.detectChanges();
      await fixture.whenStable();      // Allow translate pipe and Material to settle
      fixture.detectChanges();
      await fixture.whenStable();      // Final settle for tooltip bindings
    });

    afterEach(() => {
      mapping.project.owners = [];
    });

    it('should show BULK EDIT button', () => {
      el = fixture.debugElement.query(By.css('#bulk-change'));
      expect(el.nativeElement.textContent).toBe(' TABLE.BULK_CHANGE ');
      expect(el).toBeTruthy();
    });

    it('should show VALIDATE button', () => {
      el = fixture.debugElement.query(By.css('#validate-targets'));
      expect(el.nativeElement.textContent).toBe(' MAP.VALIDATE_TARGETS ');
      expect(el).toBeTruthy();
    });
  });

  it('should show Map title', () => {
    el = fixture.debugElement.query(By.css('h2'));
    expect(el.nativeElement.textContent).toBe('Test Map - (MAP.SINGLE_MAP)');
    expect(el).toBeTruthy();
  });

  it('should show Map table', () => {
    el = fixture.debugElement.query(By.css('table'));
    expect(el).toBeTruthy();
  });

  it('should show Paginator', () => {
    el = fixture.debugElement.query(By.css('mat-paginator'));
    expect(el).toBeTruthy();
  });

  it('should show Export Menu button and menu', () => {
    el = fixture.debugElement.query(By.css('.mat-mdc-menu-trigger'));
    expect(el).toBeTruthy();

    expect(el.nativeElement.textContent).toBe('MAP.EXPORT');

    el.triggerEventHandler('click', null);

    const menu = fixture.debugElement.query(By.css('.mat-mdc-menu-panel'));
    expect(menu).toBeTruthy();

    expect(menu.nativeElement.textContent).toBe(
      'MAP.EXPORT_CSVMAP.EXPORT_TSVMAP.EXPORT_XLSXMAP.EXPORT_FHIR_JSONMAP.EXPORT_XLSX_EXTENDED'
    );
  });
});
