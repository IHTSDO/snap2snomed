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

import {ComponentFixture, fakeAsync, TestBed, flush, discardPeriodicTasks} from '@angular/core/testing';

import {TargetRelationshipComponent} from './target-relationship.component';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../../app.module';
import {APP_CONFIG} from '../../app.config';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../../store/app.state';
import {DebugElement} from '@angular/core';
import {SelectionService} from 'src/app/_services/selection.service';
import {By} from '@angular/platform-browser';
import {MapRowRelationship, MapRowStatus, MapView} from 'src/app/_models/map_row';
import {MatIconModule} from '@angular/material/icon';
import {ErrormessageComponent} from 'src/app/errormessage/errormessage.component';
import {MatCardModule} from '@angular/material/card';
import {MatListModule} from '@angular/material/list';
import {DroppableDirective} from 'src/app/_directives/droppable.directive';
import {DraggableDirective} from 'src/app/_directives/draggable.directive';
import {FhirService} from "../../_services/fhir.service";
import {of} from "rxjs";

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
  const sourceIndex = '1';
  const targetCode = '123456';
  const targetDisplay = 'Test target';
  const targetSystem = 'http://snomed.info/sct/900000000000207008/version/20220228'
  const relationship = MapRowRelationship.EQUIVALENT;
  const target = new MapView('', '', sourceIndex, sourceCode, sourceDisplay, targetCode, targetDisplay, relationship,
    'DRAFT', false, null, null, null, null, null, false, undefined);
  const parameterValue = [
    {
      name: 'designation',
      part: [
        {
          name: 'use',
          valueCoding: {code: '900000000000003001'}
        },
        {
          name: 'language',
          valueCode: 'en'
        },
        {
          name: 'value',
          valueString: targetDisplay
        }
      ]
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatIconModule,
        MatCardModule,
        MatListModule,
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
        }), FhirService, TranslateService, SelectionService],
      declarations: [TargetRelationshipComponent, ErrormessageComponent, DroppableDirective, DraggableDirective]
    })
      .compileComponents();
    store = TestBed.inject(MockStore);
    fhirService = TestBed.inject(FhirService);
    translateService = TestBed.inject(TranslateService);
    selectionService = TestBed.inject(SelectionService);
    fixture = TestBed.createComponent(TargetRelationshipComponent);
    component = fixture.componentInstance;
    component.targetRows =  new Array<MapView>();
    component.source = {
      id: '1',
      index: sourceIndex,
      code: sourceCode,
      display: sourceDisplay,
      noMap: false,
      status: MapRowStatus.DRAFT,
      //additionalColumns: undefined,
      additionalColumnValues: []
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add target', async() => {
    spyOn(component.newTargetEvent, 'emit');
    spyOn(fhirService, 'getEnglishFsn').and.returnValue(of(targetDisplay));

    expect(component.targetRows.length).toEqual(0);

    component.addSelection(targetCode, targetDisplay, targetSystem, relationship);
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.newTargetEvent.emit).toHaveBeenCalledOnceWith(target);
    });
  });

  it('should not add duplicate target', async() => {
    component.targetRows.push(target);
    spyOn(fhirService, 'getEnglishFsn').and.returnValue(of('Test English FSN'));

    fixture.detectChanges();
    expect(component.targetRows.length).toEqual(1);
    expect(component.source).toBeTruthy();
    // Add same targetCode
    component.addSelection(targetCode, targetDisplay, targetSystem, relationship);
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.targetRows.length).toEqual(1);
      expect(component.error.message).toEqual('ERROR.DUPLICATE_TARGET_ERROR');
    });
  });

  it('should remove target', fakeAsync(() => {
    spyOn(component.removeTargetEvent, 'emit');
    component.targetRows.push(target);
    fixture.detectChanges();
    expect(component.targetRows.length).toEqual(1);
    // delete target
    component.removeTarget(target);
    fixture.detectChanges();
    expect(component.removeTargetEvent.emit).toHaveBeenCalledOnceWith(target);
  }));

  it('button should add selection', async() => {
    fixture.detectChanges();

    const code = '1234567';
    const display = 'This is a test selection';

    spyOn(component.newTargetEvent, 'emit');
    spyOn(fhirService, 'getEnglishFsn').and.returnValue(of(display));

    selectionService.select({code, display});
    el = fixture.debugElement.query(By.css('button'));
    expect(el).toBeTruthy();
    el.triggerEventHandler('click', null);
    const calledWith = new MapView('', '', sourceIndex, sourceCode, sourceDisplay, code, display, relationship,
      'DRAFT', false, null, null, null, null, null, false, undefined);

    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.newTargetEvent.emit).toHaveBeenCalledWith(calledWith);
    });

  });

  it('button should not add duplicated selection', fakeAsync(() => {
    fixture.detectChanges();

    const code = '1234567';
    const display = 'This is a test selection';

    component.targetRows.push(new MapView('', '', sourceIndex, sourceCode, sourceDisplay, code, display, relationship,
      'DRAFT', false, null, null, null, null, null, false, undefined));
    selectionService.select({code, display});

    spyOn(fhirService, 'getEnglishFsn').and.returnValue(of('Test English FSN'));
    fixture.whenStable().then(() => {
      el = fixture.debugElement.query(By.css('button'));
      console.log(el);
      el.triggerEventHandler('click', null);
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        console.log(component.error);
        expect(component.error).toEqual({message: 'ERROR.DUPLICATE_TARGET_ERROR'});
      });
    });
    flush();
    discardPeriodicTasks();
  }));

});
