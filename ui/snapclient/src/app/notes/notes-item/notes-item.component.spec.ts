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
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule} from '@angular/forms';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../../app.module';
import {APP_CONFIG} from '../../app.config';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../../store/app.state';
import {UserChipComponent} from '../../user/user-chip/user-chip.component';
import {SourceCode} from '../../_models/source_code';
import {Source} from '../../_models/source';
import {MapRow} from '../../_models/map_row';
import {Note, NoteCategory} from '../../_models/note';
import {User} from '../../_models/user';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {LastupdatedPipe} from '../../_utils/lastupdated_pipe';
import {InitialsPipe} from '../../_utils/initialize_pipe';
import {GravatarComponent} from '../../user/gravatar/gravatar.component';
import {NotesItemComponent} from './notes-item.component';

describe('NotesItemComponent', () => {
  let component: NotesItemComponent;
  let fixture: ComponentFixture<NotesItemComponent>;
  let el: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatTooltipModule,
        MatInputModule,
        MatFormFieldModule,
        NoopAnimationsModule,
        FormsModule,
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
        }), TranslateService,
      ],
      declarations: [NotesItemComponent, UserChipComponent, LastupdatedPipe, InitialsPipe, GravatarComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotesItemComponent);
    component = fixture.componentInstance;
    const row = {
      id: '1', noMap: false, sourceCode: new SourceCode('code', 'display',
        new Source(), '1', []), status: 'DRAFT'
    } as MapRow;
    component.note = new Note(1, 'Test notes', new User(), '', '', row, NoteCategory.USER);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain notes card', () => {
    el = fixture.debugElement.query(By.css('.mat-card'));
    expect(el).toBeTruthy();
  });

  it('should contain notes text', () => {
    el = fixture.debugElement.query(By.css('.mat-card p'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toBe('Test notes');
  });

  it('should contain notes timestamp', () => {
    el = fixture.debugElement.query(By.css('.timestamp'));
    expect(el).toBeTruthy();
  });
});
