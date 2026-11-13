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

import { NotesListComponent } from './notes-list.component';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { HttpLoaderFactory } from '../../app.module';
import { APP_CONFIG } from '../../app.config';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAppState } from '../../store/app.state';
import { selectCurrentMapping } from '../../store/mapping-feature/mapping.selectors';
import { MapService } from '../../_services/map.service';
import { DebugElement } from '@angular/core';
import { Mapping } from '../../_models/mapping';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { Note, NoteCategory } from '../../_models/note';
import { User } from '../../_models/user';
import { SourceCode } from '../../_models/source_code';
import { Source } from '../../_models/source';
import { MapRow } from '../../_models/map_row';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ErrorNotifier } from '../../errorhandler/errornotifier';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { DroppableDirective } from '../../_directives/droppable.directive';
import { NotesItemComponent } from '../notes-item/notes-item.component';

describe('NotesListComponent', () => {
  let component: NotesListComponent;
  let fixture: ComponentFixture<NotesListComponent>;
  let el: DebugElement;
  const mockMapService = {
    getNotesByMapRow: vi.fn().mockName('MapService.getNotesByMapRow'),
  };
  const mapping = new Mapping();
  mapping.project.title = 'Test Map';
  mapping.id = '0';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        NotesListComponent,
        NotesItemComponent,
      ],
      imports: [
        DroppableDirective,
        RouterTestingModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatDialogModule,
        MatTooltipModule,
        MatInputModule,
        MatFormFieldModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        FormsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient],
          },
        }),
      ],
      providers: [
        { provide: APP_CONFIG, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        provideMockStore({
          initialState: initialAppState,
          selectors: [{ selector: selectCurrentMapping, value: mapping }],
        }),
        TranslateService,
        ErrorNotifier,
        { provide: MapService, useValue: mockMapService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(NotesListComponent);
    component = fixture.componentInstance;
    const row = {
      id: '1',
      noMap: false,
      sourceCode: new SourceCode('code', 'display', new Source(), '1', []),
      status: 'DRAFT',
    } as MapRow;
    component.newNote = new Note(
      null,
      '',
      new User(),
      '',
      '',
      row,
      NoteCategory.USER
    );
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show notes list', () => {
    el = fixture.debugElement.query(By.css('#notes-list'));
    expect(el).toBeTruthy();
  });

  it('should show send button - disabled', () => {
    el = fixture.debugElement.query(By.css('#notes button'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.disabled).toBeTruthy();
  });

  it('should show send button - enabled', fakeAsync(() => {
    expect(component.newNote).toBeTruthy();
    if (component.newNote) {
      const textarea = fixture.debugElement.query(By.css('textarea'));
      textarea.nativeElement.value = 'tests';
      textarea.triggerEventHandler('input', { target: textarea.nativeElement });
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      expect(
        fixture.debugElement.nativeElement.querySelector('#notes button')
          .disabled
      ).toBeFalsy();
    }
  }));
});
