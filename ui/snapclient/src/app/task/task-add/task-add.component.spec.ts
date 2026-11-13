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

import {
  ComponentFixture,
  fakeAsync,
  tick,
  TestBed,
} from '@angular/core/testing';

import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpLoaderFactory } from '../../app.module';
import { APP_CONFIG } from '../../app.config';
import { initialAppState } from '../../store/app.state';
import {
  selectTaskList,
  selectTaskSaveError,
} from '../../store/task-feature/task.selectors';
import {
  selectCurrentMapping,
  selectSelectedRows,
} from '../../store/mapping-feature/mapping.selectors';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TaskAddComponent } from './task-add.component';
import { User } from '../../_models/user';
import { Mapping } from '../../_models/mapping';
import { Task, TaskType } from '../../_models/task';
import { MappedRowDetailsDto } from '../../_models/map_row';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { ErrormessageComponent } from '../../errormessage/errormessage.component';
import { MatCardModule } from '@angular/material/card';
import { MatSelectHarness } from '@angular/material/select/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScannedActionsSubject } from '@ngrx/store';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MappingTableSelectorComponent } from 'src/app/mapping/mapping-table-selector/mapping-table-selector.component';
import { InitialsPipe } from '../../_utils/initialize_pipe';
import { UserChipComponent } from '../../user/user-chip/user-chip.component';
import { GravatarComponent } from '../../user/gravatar/gravatar.component';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('TaskAddComponent', () => {
  let component: TaskAddComponent;
  let fixture: ComponentFixture<TaskAddComponent>;
  let translateService: TranslateService;
  let loader: HarnessLoader;

  const user = new User();
  user.id = 'abcdef';
  user.givenName = 'Jo';
  user.familyName = 'Smith';

  const mapping = new Mapping();
  mapping.project.title = 'Test Map';
  const task = new Task(
    '1',
    TaskType.AUTHOR,
    '',
    mapping,
    user,
    '1-10',
    10,
    '',
    '',
    false,
    false
  );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TaskAddComponent,
        ErrormessageComponent,
        MappingTableSelectorComponent,
        InitialsPipe,
        UserChipComponent,
        GravatarComponent,
      ],
      imports: [
        MatTabsModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatRadioModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        MatSlideToggleModule,
        MatTooltipModule,
        MatDialogModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient],
          },
        }),
      ],
      providers: [
        TranslateService,
        ScannedActionsSubject,
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: APP_CONFIG, useValue: {} },
        provideMockStore({
          initialState: initialAppState,
          selectors: [
            { selector: selectTaskList, value: [task] },
            { selector: selectSelectedRows, value: [] },
            { selector: selectCurrentMapping, value: null },
            { selector: selectTaskSaveError, value: null },
          ],
        }),
        provideNoopAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    translateService = TestBed.inject(TranslateService);
    fixture = TestBed.createComponent(TaskAddComponent);
    component = fixture.componentInstance;
    component.translate = translateService;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not create form if task is null', () => {
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('form'));
    expect(el).toBeFalsy();
  });

  // Tests that need the form rendered: pre-set ALL properties that affect template
  // conditionals before the first detectChanges so no @if or binding transitions
  // mid-cycle and causes NG0100.
  describe('with task', () => {
    beforeEach(fakeAsync(() => {
      fixture.destroy();
      fixture = TestBed.createComponent(TaskAddComponent);
      component = fixture.componentInstance;
      component.translate = translateService;
      loader = TestbedHarnessEnvironment.loader(fixture);
      component.task = task;
      component.currentUser = user;
      component.members = [user];
      component.isMember = true;
      component.isOwner = true;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should create form if task is set', () => {
      const el = fixture.debugElement.query(By.css('form')).nativeElement;
      expect(el).toBeTruthy();
    });

    it('should create cancel button', () => {
      const el = fixture.debugElement.query(
        By.css('button[type="cancel"]')
      ).nativeElement;
      expect(el).toBeTruthy();
    });

    it('should show submit button when valid', () => {
      const el = fixture.debugElement.query(
        By.css('button[type="submit"]')
      ).nativeElement;
      expect(el).toBeTruthy();
    });

    it('should set default assignee in dropdown', fakeAsync(async () => {
      expect(component.task?.assignee.id).toEqual(component.currentUser!.id);
      const matSelect = await loader.getHarness(
        MatSelectHarness.with({ selector: '#assignee' })
      );
      expect(matSelect).toBeTruthy();
    }));

    it('should set default description if none', fakeAsync(() => {
      expect(component.task).toBeTruthy();
      expect(component.task!.description).toEqual('');
      const el = fixture.debugElement.query(By.css('#assignRows'));
      el.nativeElement.dispatchEvent(new Event('change'));
      tick();
      fixture.detectChanges();
      expect(component.task?.description?.length).toBeGreaterThan(1);
    }));
  });

  // Two things reset assignRows during detectChanges():
  //  1. ngOnInit's selectSelectedRows subscription ([] → else branch → assignRows='')
  //  2. ngAfterViewInit calling initTask() → assignRows=''
  // Fix: override the selector to return a non-empty array (prevents else branch) and
  // spy initTask as a no-op (prevents ngAfterViewInit reset), then pre-set assignRows='SELECTED'.
  describe('with task and SELECTED rows', () => {
    beforeEach(fakeAsync(() => {
      fixture.destroy();
      fixture = TestBed.createComponent(TaskAddComponent);
      component = fixture.componentInstance;
      component.translate = translateService;
      loader = TestbedHarnessEnvironment.loader(fixture);
      component.task = task;
      component.currentUser = user;
      component.members = [user];
      component.isMember = true;
      component.isOwner = true;
      component.assignRows = 'SELECTED';
      const store = TestBed.inject(MockStore);
      store.overrideSelector(selectSelectedRows, [
        new MappedRowDetailsDto(1, null, 1),
      ]);
      vi.spyOn(component, 'initTask').mockImplementation(() => {});
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should show rows selected if SELECTED option', () => {
      const el = fixture.debugElement.query(
        By.css('.selected-rows')
      ).nativeElement;
      expect(el).toBeTruthy();
    });
  });
});
