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

import {ComponentFixture, discardPeriodicTasks, fakeAsync, flush, inject, TestBed} from '@angular/core/testing';
import {MappingTableComponent} from './mapping-table.component';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../../app.module';
import {APP_CONFIG} from '../../app.config';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../../store/app.state';
import {selectCurrentMapping, selectSelectedRows} from '../../store/mapping-feature/mapping.selectors';
import {Mapping} from '../../_models/mapping';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatCardModule} from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';
import {InitialsPipe} from '../../_utils/initialize_pipe';
import {LastupdatedPipe} from '../../_utils/lastupdated_pipe';
import {MatSort} from '@angular/material/sort';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {ErrormessageComponent} from '../../errormessage/errormessage.component';
import {MapRowRelationship, MapView, Page} from 'src/app/_models/map_row';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {By} from '@angular/platform-browser';
import {ChangeDetectorRef, DebugElement} from '@angular/core';
import {MatDialogModule} from '@angular/material/dialog';
import {MapService} from 'src/app/_services/map.service';
import {Task, TaskType} from 'src/app/_models/task';
import {User} from 'src/app/_models/user';
import {MatTableModule} from '@angular/material/table';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {BulkchangeComponent} from '../bulkchange/bulkchange.component';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';
import {MappingTableSelectorComponent} from '../mapping-table-selector/mapping-table-selector.component';

describe('MappingTableComponent', () => {
  let component: MappingTableComponent;
  let fixture: ComponentFixture<MappingTableComponent>;
  let translateService: TranslateService;
  let store: MockStore<IAppState>;
  let el: DebugElement;
  const mockMapService = jasmine.createSpyObj('MapService', ['getMapView', 'updateMapView', 'updateNoMap']);

  const mapping = new Mapping();
  mapping.project.title = 'Test Map';
  mapping.id = '0';

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
        MatSnackBarModule,
        MatDialogModule,
        MatPaginatorModule,
        MatTableModule,
        MatTooltipModule,
        MatCheckboxModule,
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatBottomSheetModule,
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
            {selector: selectCurrentMapping, value: mapping},
            {selector: selectSelectedRows, value: []}
          ],
        }), TranslateService,
        { provide: MapService, useValue: mockMapService }],
      declarations: [MappingTableComponent,
        InitialsPipe,
        LastupdatedPipe,
        MatSort,
        MatPaginator,
        ErrormessageComponent,
        BulkchangeComponent,
        MappingTableSelectorComponent]
    })
      .compileComponents();
  // });
  //
  // beforeEach(() => {
    store = TestBed.inject(MockStore);
    translateService = TestBed.inject(TranslateService);
    fixture = TestBed.createComponent(MappingTableComponent);
    component = fixture.componentInstance;
    component.translate = translateService;
    component.allSourceDetails = [];
    component.filterEnabled = false;
    const mapViews: MapView[] = [];
    const tobeSpiedOn = new MapView('1', '1231', '1', '1', '1111', 'test source',
      '1234', 'testtarget', 'EQUIVALENT', 'DRAFT', false, null,
      null, null, null, null, null, false, false, undefined, [], null);
    mapViews.push(tobeSpiedOn);
    mapViews.push(new MapView('2', '0000', '2', '2', '2222', 'test source2',
      '5678', 'testtarget2', 'EQUIVALENT', 'DRAFT', false, null,
      null, null, null, null, null, false, false, undefined, [], null));
    const page = new Page(mapViews, 0, 20, 2, 1);
    mockMapService.getMapView.and.returnValue(
      of({
        content: mapViews,
        page
      })
    );
    /**
     * We need to mock these for the test to work. The actual return values don't really matter for the tests
     * but it could change in the future
     */
    mockMapService.updateMapView.and.callFake(() => {
      fixture.detectChanges();
      return {
        // tslint:disable-next-line:typedef
        subscribe() {
          fixture.detectChanges();
        }
      };
    });
    mockMapService.updateNoMap.and.callFake(() => {
      return;
    });
    spyOn(component, 'updateMapRow').and.callFake(() => {
      return;
    });
    spyOn(component, 'updateMapRowTarget').and.callFake(() => {
      return;
    });
    const user = new User();
    user.givenName = 'Jo';
    component.task = new Task('0', TaskType.AUTHOR, 'test', mapping, user, '1-10', 10, 'now', 'now', false, false);
    const changeDetectorRef = fixture.debugElement.injector.get(ChangeDetectorRef);
    component.mappingTableSelector = new MappingTableSelectorComponent(component.table, changeDetectorRef, store);
    component.mappingTableSelector.isAnySelected = false;
    component.mappingTableSelector.isPageSelected = false;
    component.mappingTableSelector.cdRef.detectChanges();
    fixture.detectChanges();
    component.page = page;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show relationship tooltip correctly', () => {
    const relationship = MapRowRelationship.NARROWER;
    const expected = 'MAP.TARGET_NARROWER_SOURCE'; // Target is narrower than Source;
    expect(component.explainRelationship(relationship)).toBe(expected);
    const explanationNotRequired = MapRowRelationship.EQUIVALENT;
    expect(component.explainRelationship(explanationNotRequired)).toBe('');
  });

  it(`should inject translate service`, inject([TranslateService], async (injectService: TranslateService) => {
      expect(injectService).toBe(translateService);
    })
  );

  it('should show table', () => {
    component.mappingTableSelector?.cdRef.detectChanges();
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('table')).nativeElement;
    expect(el).toBeTruthy();
  });

  it('should show confirm dialog', fakeAsync(() => {
    /**
     * Try to set this with mocked functions this did not work in the tests
     */
    if (component.page) {
      component.page.data[0].hasNoMapChanged = () => {
        return true;
      };
    }
    component.mappingTableSelector?.cdRef.detectChanges();
    fixture.detectChanges();
    const checkboxes = fixture.debugElement.queryAll(By.css('mat-checkbox'));
    const checkInput = checkboxes[3].query(By.css('input')).nativeElement;
    expect(checkInput).toBeTruthy();
    const dialogBeforeClick = document.querySelector('.confirm-dialog-content');
    expect(dialogBeforeClick).toBeFalsy();
    /**
     * Had to wait until everything rendered to click the checkbox
     */
    fixture.whenStable().then(() => {
      checkInput.click();
      component.mappingTableSelector?.cdRef.detectChanges();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        component.mappingTableSelector?.cdRef.detectChanges();
        fixture.detectChanges();
        // Checking with query(By.css doesn't work here for some reason
        const dialogAfterCick = document.querySelector('.confirm-dialog-content');
        expect(dialogAfterCick).toBeTruthy();
      });
    });
    flush();
    discardPeriodicTasks();
  }));

});
