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

import {SourceDetailComponent} from './source-detail.component';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../../app.module';
import {APP_CONFIG} from '../../app.config';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../../store/app.state';
import {SourceCode} from '../../_models/source_code';
import {Source} from '../../_models/source';
import {By} from '@angular/platform-browser';
import {DebugElement} from '@angular/core';

describe('SourceDetailComponent', () => {
  let component: SourceDetailComponent;
  let fixture: ComponentFixture<SourceDetailComponent>;
  let el: DebugElement;

  const source = new Source();
  source.id = '1';
  source.name = 'Test source codeset';
  source.version = '1.0';
  const sourceCode = new SourceCode('ABC', 'Alphabet', source, '0');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
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
        }), TranslateService],
      declarations: [SourceDetailComponent]
    })
      .compileComponents();
    fixture = TestBed.createComponent(SourceDetailComponent);
    component = fixture.componentInstance;
    component.source = sourceCode;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show source details table', () => {
    el = fixture.debugElement.query(By.css('#source-details-panel'));
    expect(el).toBeTruthy();
  });

  it('should show source code header', () => {
    el = fixture.debugElement.query(By.css('#source-code-row th'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toBe('TABLE.SOURCE_CODE');
  });

  it('should show source code value', () => {
    el = fixture.debugElement.query(By.css('#source-code-row td'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toBe(sourceCode.code);
  });
});
