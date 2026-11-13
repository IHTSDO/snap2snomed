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

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MappingWorkComponent } from './mapping-work.component';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpLoaderFactory } from '../../app.module';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_CONFIG } from '../../app.config';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { IAppState, initialAppState } from '../../store/app.state';
import { selectCurrentMapping, selectMappingError } from '../../store/mapping-feature/mapping.selectors';
import { Task, TaskType } from '../../_models/task';
import { User } from '../../_models/user';
import { Mapping } from '../../_models/mapping';
import { DebugElement, NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ErrormessageComponent } from '../../errormessage/errormessage.component';
import { MappingTableComponent } from '../mapping-table/mapping-table.component';

import { MatSelectModule } from '@angular/material/select';
import { selectCurrentUser } from '../../store/auth-feature/auth.selectors';
import { selectTaskList } from '../../store/task-feature/task.selectors';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TrimPipe } from '../../_utils/trim_pipe';
import { LastupdatedPipe } from '../../_utils/lastupdated_pipe';
import { TaskItemComponent } from '../../task/task-item/task-item.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MappingDetailsCardComponent } from '../mapping-details-card/mapping-details-card.component';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';


describe('MappingWorkComponent', () => {
    let component: MappingWorkComponent;
    let fixture: ComponentFixture<MappingWorkComponent>;
    let el: DebugElement;
    let translateService: TranslateService;
    let store: MockStore<IAppState>;

    const user = new User();
    user.givenName = 'Jo';

    const mapping = new Mapping();
    mapping.project = {
        title: 'Test Map'
    } as any;
    const task = new Task('0', TaskType.AUTHOR, 'test', mapping, user, '1-10', 10, 'now', 'now', false, false);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MappingWorkComponent, ErrormessageComponent, MappingTableComponent, TaskItemComponent, TrimPipe, LastupdatedPipe,
                MappingDetailsCardComponent],
            imports: [
                MatSortModule,
                MatPaginatorModule,
                MatSelectModule,
                MatSnackBarModule,
                MatTooltipModule,
                MatDialogModule,
                MatBottomSheetModule,
                MatMenuModule,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useFactory: HttpLoaderFactory,
                        deps: [HttpClient]
                    }
                })],
            providers: [
                provideRouter([]),
                { provide: APP_CONFIG, useValue: {} },
                provideMockStore({
                    initialState: initialAppState,
                    selectors: [
                        { selector: selectMappingError, value: 'error' },
                        { selector: selectCurrentUser, value: user },
                        { selector: selectCurrentMapping, value: mapping },
                        { selector: selectTaskList, value: [task] }
                    ],
                }), TranslateService,
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting()
            ],
            schemas: [NO_ERRORS_SCHEMA]
        })
            .compileComponents();
        store = TestBed.inject(MockStore);
        translateService = TestBed.inject(TranslateService);
        fixture = TestBed.createComponent(MappingWorkComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show map title', () => {

        component.task = task;

        fixture.detectChanges();

        const el = fixture.debugElement.query(By.css('h2#map-title'));

        expect(el.nativeElement.textContent)
            .toBe(`${task.mapping.project.title} - (MAP.SINGLE_MAP)`);
    });

    it('should clear the error message once the store error resolves to null', () => {
        fixture.detectChanges();
        component.error = {message: 'Some error'};

        store.overrideSelector(selectMappingError, null);
        store.refreshState();

        expect(component.error).toEqual({});
    });
});

