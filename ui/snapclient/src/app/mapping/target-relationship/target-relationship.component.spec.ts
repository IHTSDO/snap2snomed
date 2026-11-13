import type { Mock } from 'vitest';
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
  TestBed,
  flush,
  discardPeriodicTasks,
  fakeAsync,
  tick,
  flushMicrotasks,
} from '@angular/core/testing';

import { TargetRelationshipComponent } from './target-relationship.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { HttpLoaderFactory } from '../../app.module';
import { APP_CONFIG } from '../../app.config';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { IAppState, initialAppState } from '../../store/app.state';
import { DebugElement } from '@angular/core';
import { SelectionService } from 'src/app/_services/selection.service';
import { By } from '@angular/platform-browser';
import {
  MapRowRelationship,
  MapRowStatus,
  MapView,
} from 'src/app/_models/map_row';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ErrormessageComponent } from 'src/app/errormessage/errormessage.component';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { DroppableDirective } from 'src/app/_directives/droppable.directive';
import { DraggableDirective } from 'src/app/_directives/draggable.directive';
import { FhirService } from '../../_services/fhir.service';
import { of } from 'rxjs';
import { UntypedFormBuilder } from '@angular/forms';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('TargetRelationshipComponent', () => {
  let component: TargetRelationshipComponent;
  let fixture: ComponentFixture<TargetRelationshipComponent>;
  let el: DebugElement;
  let fhirService: FhirService;
  let translateService: TranslateService;
  let selectionService: SelectionService;
  let store: MockStore<IAppState>;

  const sourceCode = '1212121';
  const sourceDisplay = 'This is test';
  const sourceId = '1';
  const sourceIndex = '1';
  const targetCode = '123456';
  const targetDisplay = 'Test target';
  const targetSystem =
    'http://snomed.info/sct/900000000000207008/version/20220228';
  const relationship = MapRowRelationship.EQUIVALENT;
  const target = new MapView(
    '',
    '',
    sourceId,
    sourceIndex,
    sourceCode,
    sourceDisplay,
    targetCode,
    targetDisplay,
    relationship,
    'DRAFT',
    false,
    null,
    null,
    null,
    null,
    null,
    null,
    false,
    false,
    undefined,
    undefined,
    null
  );
  const parameterValue = [
    {
      name: 'designation',
      part: [
        {
          name: 'use',
          valueCoding: { code: '900000000000003001' },
        },
        {
          name: 'language',
          valueCode: 'en',
        },
        {
          name: 'value',
          valueString: targetDisplay,
        },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TargetRelationshipComponent,
        ErrormessageComponent,
        DraggableDirective,
      ],
      imports: [
        DroppableDirective,
        MatSelectModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCardModule,
        MatListModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient],
          },
        }),
      ],
      providers: [
        provideNoopAnimations(),
        { provide: APP_CONFIG, useValue: {} },
        provideMockStore({
          initialState: initialAppState,
        }),
        FhirService,
        TranslateService,
        SelectionService,
        UntypedFormBuilder,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    fhirService = TestBed.inject(FhirService);
    translateService = TestBed.inject(TranslateService);
    selectionService = TestBed.inject(SelectionService);
    fixture = TestBed.createComponent(TargetRelationshipComponent);
    component = fixture.componentInstance;
    component.targetRows = new Array<MapView>();
    component.source = {
      id: '1',
      index: sourceIndex,
      code: sourceCode,
      display: sourceDisplay,
      noMap: false,
      status: MapRowStatus.DRAFT,
      additionalColumnValues: [],
      additionalColumnNames: [],
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add target', async () => {
    const emitSpy = vi.spyOn(component.newTargetEvent, 'emit');
    vi.spyOn(fhirService, 'getEnglishFsn').mockReturnValue(of(targetDisplay));

    expect(component.targetRows.length).toEqual(0);

    component.addSelection(
      targetCode,
      targetDisplay,
      targetSystem,
      relationship
    );
    await fixture.whenStable();
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(target);
  });

  it('should not add duplicate target', fakeAsync(() => {
    vi.spyOn(fhirService, 'getEnglishFsn').mockReturnValue(
      of('Test English FSN')
    );

    vi.spyOn(translateService, 'get').mockReturnValue(
      of('ERROR.DUPLICATE_TARGET_ERROR')
    );

    vi.spyOn(component.newTargetEvent, 'emit');

    component.source = {
      id: sourceId,
      index: sourceIndex,
      code: sourceCode,
      display: sourceDisplay,
      noMap: false,
      status: 'DRAFT',
      additionalColumnValues: [],
      additionalColumnNames: [],
    };

    fixture.detectChanges();

    // FIRST CALL (creates item)
    component.addSelection(targetCode, targetDisplay, 'system', relationship);
    flushMicrotasks();
    tick();

    // simulate parent state update (critical)
    component.targetRows = [{ targetCode: targetCode } as any];

    expect(component.newTargetEvent.emit).toHaveBeenCalled();

    // reset for second assertion
    component.error = {} as any;
    (component.newTargetEvent.emit as Mock).mockClear();

    // SECOND CALL (duplicate)
    component.addSelection(targetCode, targetDisplay, 'system', relationship);

    flushMicrotasks();
    tick();
    fixture.detectChanges();

    expect(component.error?.message).toBe('ERROR.DUPLICATE_TARGET_ERROR');

    expect(component.newTargetEvent.emit).not.toHaveBeenCalled();
  }));

  it('should remove target', async () => {
    const emitSpy = vi.spyOn(component.removeTargetEvent, 'emit');

    component.targetRows.push(target);

    component.removeTarget(target);

    expect(emitSpy).toHaveBeenCalledWith(target);
  });

  it('button should add selection', async () => {
    fixture.detectChanges();

    const code = '1234567';
    const display = 'This is a test selection';

    const emitSpy = vi.spyOn(component.newTargetEvent, 'emit');
    vi.spyOn(fhirService, 'getEnglishFsn').mockReturnValue(of(display));

    selectionService.select({ code, display });
    el = fixture.debugElement.query(By.css('button'));
    expect(el).toBeTruthy();
    el.triggerEventHandler('click', null);
    const calledWith = new MapView(
      '',
      '',
      sourceId,
      sourceIndex,
      sourceCode,
      sourceDisplay,
      code,
      display,
      relationship,
      'DRAFT',
      false,
      null,
      null,
      null,
      null,
      null,
      null,
      false,
      false,
      undefined,
      undefined,
      null
    );

    await fixture.whenStable();
    fixture.detectChanges();
    expect(emitSpy).toHaveBeenCalledWith(calledWith);
  });

  it('should show duplicate error when same selection is added twice', fakeAsync(() => {
    const code = '1234567';
    const display = 'Test selection';

    vi.spyOn(fhirService, 'getEnglishFsn').mockReturnValue(
      of('Test English FSN')
    );

    vi.spyOn(translateService, 'get').mockReturnValue(
      of('ERROR.DUPLICATE_TARGET_ERROR')
    );

    // simulate parent-provided source
    component.source = {
      id: sourceId,
      index: sourceIndex,
      code: sourceCode,
      display: sourceDisplay,
      noMap: false,
      status: 'DRAFT',
      additionalColumnValues: [],
      additionalColumnNames: [],
    };

    fixture.detectChanges();

    // FIRST ADD
    component.addSelection(code, display, 'system', relationship);
    flushMicrotasks();
    tick();

    // simulate parent updating @Input after emit
    component.targetRows = [
      {
        targetCode: code,
      } as any,
    ];

    expect(component.targetRows.length).toBe(1);

    // reset error
    component.error = {} as any;

    // SECOND ADD (duplicate)
    component.addSelection(code, display, 'system', relationship);

    flushMicrotasks();
    tick();
    fixture.detectChanges();

    expect(component.error?.message).toBe('ERROR.DUPLICATE_TARGET_ERROR');
  }));
});
