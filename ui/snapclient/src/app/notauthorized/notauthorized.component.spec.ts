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

import {NotauthorizedComponent} from './notauthorized.component';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../app.module';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {APP_CONFIG} from '../app.config';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../store/app.state';
import {DebugElement} from '@angular/core';
import {RouterTestingModule} from '@angular/router/testing';
import {By} from '@angular/platform-browser';
import {MatIconModule} from '@angular/material/icon';

describe('NotauthorizedComponent', () => {
  let component: NotauthorizedComponent;
  let fixture: ComponentFixture<NotauthorizedComponent>;
  let translateService: TranslateService;
  let store: MockStore<IAppState>;
  let el: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
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
        { provide: APP_CONFIG, useValue: {} },
        provideMockStore({
          initialState: initialAppState
        }), TranslateService],
      declarations: [ NotauthorizedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    translateService = TestBed.inject(TranslateService);
    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(NotauthorizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show NOT AUTHORIZED title', () => {
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('h1'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toBe('ERROR.NOT_AUTHORIZED');
  });

  it('should show NOT AUTHORIZED text', () => {
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('p'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toBe('ERROR.NOT_AUTHORIZED_EXPLANATION');
  });

  it('should show return button', () => {
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('button'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.attributes.title.textContent).toBe('ERROR.NOT_AUTHORIZED_RETURN');
  });
});
