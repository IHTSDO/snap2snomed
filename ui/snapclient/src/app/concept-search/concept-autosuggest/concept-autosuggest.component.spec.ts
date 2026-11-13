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

import { provideHttpClientTesting } from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {APP_CONFIG} from 'src/app/app.config';
import {HttpLoaderFactory} from 'src/app/app.module';
import {initialAppState} from 'src/app/store/app.state';

import {ConceptAutosuggestComponent} from './concept-autosuggest.component';
import {ConceptListComponent} from '../concept-list/concept-list.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {MatTableModule} from '@angular/material/table';

describe('ConceptAutosuggestComponent', () => {
  let component: ConceptAutosuggestComponent;
  let fixture: ComponentFixture<ConceptAutosuggestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [ConceptAutosuggestComponent, ConceptListComponent],
    imports: [MatTableModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory
            }
        })],
    providers: [TranslateService, { provide: APP_CONFIG, useValue: {} },
        provideMockStore({ initialState: initialAppState }), provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConceptAutosuggestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
