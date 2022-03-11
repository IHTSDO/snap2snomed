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

import {ComponentFixture, fakeAsync, TestBed} from '@angular/core/testing';

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

describe('TargetRelationshipComponent', () => {
  let component: TargetRelationshipComponent;
  let fixture: ComponentFixture<TargetRelationshipComponent>;
  let el: DebugElement;
  let translateService: TranslateService;
  let selectionService: SelectionService;
  let store: MockStore<IAppState>;

  const sourceCode = '1212121';
  const sourceDisplay = 'This is test';
  const sourceIndex = '1';
  const targetCode = '123456';
  const targetDisplay = 'Test target';
  const relationship = MapRowRelationship.EQUIVALENT;
  const target = new MapView('', '', sourceIndex, sourceCode, sourceDisplay, targetCode, targetDisplay, relationship,
    'DRAFT', false, null, null, null, null, null, false);


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
        }), TranslateService, SelectionService],
      declarations: [TargetRelationshipComponent]
    })
      .compileComponents();
    store = TestBed.inject(MockStore);
    translateService = TestBed.inject(TranslateService);
    selectionService = TestBed.inject(SelectionService);
    fixture = TestBed.createComponent(TargetRelationshipComponent);
    component = fixture.componentInstance;
    component.source = {
      id: '1',
      index: sourceIndex,
      code: sourceCode,
      display: sourceDisplay,
      noMap: false,
      status: MapRowStatus.DRAFT
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add target', () => {
    spyOn(component.newTargetEvent, 'emit');
    expect(component.targetRows.length).toEqual(0);

    component.addSelection(targetCode, targetDisplay, relationship);
    fixture.detectChanges();
    expect(component.newTargetEvent.emit).toHaveBeenCalledOnceWith(target);
  });

  it('should not add duplicate target', () => {
    component.targetRows.push(target);
    fixture.detectChanges();
    expect(component.targetRows.length).toEqual(1);
    expect(component.source).toBeTruthy();
    // Add same targetCode
    component.addSelection(targetCode, targetDisplay, relationship);
    fixture.detectChanges();
    expect(component.targetRows.length).toEqual(1);
    expect(component.error.message).toEqual('ERROR.DUPLICATE_TARGET_ERROR');
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

  it('button should add selection', () => {
    fixture.detectChanges();

    const code = '1234567';
    const display = 'This is a test selection';

    spyOn(component.newTargetEvent, 'emit');
    selectionService.select({code, display});
    el = fixture.debugElement.query(By.css('button'));
    expect(el).toBeTruthy();
    el.triggerEventHandler('click', null);
    const calledWith = new MapView('', '', sourceIndex, sourceCode, sourceDisplay, code, display, relationship,
      'DRAFT', false, null, null, null, null, null, false);
    expect(component.newTargetEvent.emit).toHaveBeenCalledWith(calledWith);
  });

  it('button should not add duplicated selection', () => {
    fixture.detectChanges();

    const code = '1234567';
    const display = 'This is a test selection';

    component.targetRows.push(new MapView('', '', sourceIndex, sourceCode, sourceDisplay, code, display, relationship,
      'DRAFT', false, null, null, null, null, null, false));
    selectionService.select({code, display});
    el = fixture.debugElement.query(By.css('button'));
    el.triggerEventHandler('click', null);
    expect(component.error).toEqual({message: 'ERROR.DUPLICATE_TARGET_ERROR'});
  });

});
