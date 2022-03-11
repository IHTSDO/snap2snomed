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

import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';

import {MappingViewComponent} from './mapping-view.component';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../../store/app.state';
import {ChangeDetectorRef, DebugElement} from '@angular/core';
import {User} from '../../_models/user';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatCardModule} from '@angular/material/card';
import {HttpLoaderFactory} from '../../app.module';
import {selectCurrentMapping, selectMappingError, selectSelectedRows} from '../../store/mapping-feature/mapping.selectors';
import {Mapping} from '../../_models/mapping';
import {selectCurrentUser} from '../../store/auth-feature/auth.selectors';
import {InitialsPipe} from '../../_utils/initialize_pipe';
import {LastupdatedPipe} from '../../_utils/lastupdated_pipe';
import {ErrormessageComponent} from '../../errormessage/errormessage.component';
import {By} from '@angular/platform-browser';
import {MatChipsModule} from '@angular/material/chips';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {APP_CONFIG} from '../../app.config';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import { BulkchangeComponent } from '../bulkchange/bulkchange.component';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MappingTableSelectorComponent } from '../mapping-table-selector/mapping-table-selector.component';
import {MappingDetailsCardComponent} from '../mapping-details-card/mapping-details-card.component';
import {ActivatedRoute} from '@angular/router';
import {Observable, of} from 'rxjs';

describe('MappingViewComponent', () => {
  let component: MappingViewComponent;
  let fixture: ComponentFixture<MappingViewComponent>;
  let store: MockStore<IAppState>;
  let el: DebugElement;

  const user = new User();
  user.givenName = 'Jo';

  const mapping = new Mapping();
  mapping.id = '1';
  mapping.project.title = 'Test Map';

  beforeEach(async (done) => {
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
        MatDialogModule,
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
        {provide: ActivatedRoute,
          useValue: {
            params: of({
              mappingid: mapping.id,
            }),
            queryParams: of({
            })
          }
        },
        provideMockStore({
          initialState: initialAppState,
          selectors: [
            {selector: selectMappingError, value: 'MockError'},
            {selector: selectCurrentMapping, value: mapping},
            {selector: selectCurrentUser, value: user},
            {selector: selectSelectedRows, value: null},
          ],
        }), TranslateService],
      declarations: [
        MappingViewComponent,
        InitialsPipe,
        LastupdatedPipe,
        MatSort,
        MatPaginator,
        ErrormessageComponent,
        BulkchangeComponent,
        MappingDetailsCardComponent,
        MappingTableSelectorComponent
      ]
    }).compileComponents();
    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(MappingViewComponent);
    component = fixture.componentInstance;
    const changeDetectorRef = fixture.debugElement.injector.get(ChangeDetectorRef);
    component.mappingTableSelector = new MappingTableSelectorComponent(component.table, changeDetectorRef, store);
    component.allSourceDetails = [];
    component.ngOnInit();
    await setTimeout(function() {
      done();
      fixture.detectChanges();
    }, 200);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should show EDIT MAP button', () => {
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('a'));
    expect(el.nativeElement.textContent).toBe(' MAP.MAP_VIEW_BUTTON ');
    expect(el).toBeTruthy();
  });

  it('should show BULK EDIT button', () => {
    const currentUser = component.currentUser;
    try {
      mapping.project.owners = [user];
      component.currentUser = user;
      fixture.detectChanges();
      el = fixture.debugElement.query(By.css('#bulk-change'));
      expect(el.nativeElement.textContent).toBe(' TABLE.BULK_CHANGE ');
      expect(el).toBeTruthy();
    } finally {
      component.currentUser = currentUser;
      mapping.project.owners = [];
    }
  });

  it('should show VALIDATE button', () => {
    const currentUser = component.currentUser;
    try {
      mapping.project.owners = [user];
      component.currentUser = user;
      fixture.detectChanges();
      el = fixture.debugElement.query(By.css('#validate-targets'));
      expect(el.nativeElement.textContent).toBe(' MAP.VALIDATE_TARGETS ');
      expect(el).toBeTruthy();
    } finally {
      component.currentUser = currentUser;
      mapping.project.owners = [];
    }
  });

  /**
   * Test for <h2>{{mapping.project.title}}</h2>
   */
  it('should show Map title', () => {
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('h2'));
    expect(el.nativeElement.textContent).toBe('Test Map');
    expect(el).toBeTruthy();
  });

  it('should show Map table', () => {
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('table'));
    expect(el).toBeTruthy();
  });

  it('should show Paginator', () => {
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('mat-paginator'));
    expect(el).toBeTruthy();
  });

  it('should show Export Menu button and menu', () => {
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('.mat-menu-trigger'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toBe('MAP.EXPORT');
    el.triggerEventHandler('click', null);
    const menu = fixture.debugElement.query(By.css('.mat-menu-panel'));
    expect(menu).toBeTruthy();
    expect(menu.nativeElement.textContent).toBe('MAP.EXPORT_CSVMAP.EXPORT_TSVMAP.EXPORT_XLSX');
  });

});
