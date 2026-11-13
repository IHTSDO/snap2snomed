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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ConceptSearchComponent} from './concept-search.component';
import {APP_CONFIG} from '../app.config';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../store/app.state';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../app.module';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ReactiveFormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {ErrormessageComponent} from '../errormessage/errormessage.component';
import {ConceptListComponent} from './concept-list/concept-list.component';
import {ConceptAutosuggestComponent} from './concept-autosuggest/concept-autosuggest.component';
import {DroppableDirective} from '../_directives/droppable.directive';
import {DraggableDirective} from '../_directives/draggable.directive';

describe('ConceptSearchComponent', () => {
  let component: ConceptSearchComponent;
  let fixture: ComponentFixture<ConceptSearchComponent>;
  let el: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [
        ConceptSearchComponent,
        ErrormessageComponent,
        ConceptListComponent,
        ConceptAutosuggestComponent,
        DraggableDirective
    ],
    imports: [
        DroppableDirective,
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatTableModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        })],
    providers: [TranslateService, { provide: APP_CONFIG, useValue: {} },
        provideMockStore({ initialState: initialAppState }), provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
})
      .compileComponents();

    fixture = TestBed.createComponent(ConceptSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should clear search box', () => {
    component.searchControl.setValue('test');
    fixture.detectChanges();
    el = fixture.debugElement.query(By.css('#btn-search-clear'));
    expect(el).toBeTruthy();
    el.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(component.searchControl.value).toBe('');
  });


});
