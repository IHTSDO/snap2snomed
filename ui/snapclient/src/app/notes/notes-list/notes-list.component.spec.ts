import {ComponentFixture, TestBed} from '@angular/core/testing';

import {NotesListComponent} from './notes-list.component';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';
import {MatTooltipModule} from '@angular/material/tooltip';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../../app.module';
import {APP_CONFIG} from '../../app.config';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../../store/app.state';
import {selectCurrentMapping} from '../../store/mapping-feature/mapping.selectors';
import {MapService} from '../../_services/map.service';
import {DebugElement} from '@angular/core';
import {Mapping} from '../../_models/mapping';
import {MatInputModule} from '@angular/material/input';
import {By} from '@angular/platform-browser';
import {Note} from '../../_models/note';
import {User} from '../../_models/user';
import {SourceCode} from '../../_models/source_code';
import {Source} from '../../_models/source';
import {MapRow} from '../../_models/map_row';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';

describe('NotesListComponent', () => {
  let component: NotesListComponent;
  let fixture: ComponentFixture<NotesListComponent>;
  let el: DebugElement;
  const mockMapService = jasmine.createSpyObj('MapService', ['getNotesByMapRow']);
  const mapping = new Mapping();
  mapping.project.title = 'Test Map';
  mapping.id = '0';

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
          selectors: [
            {selector: selectCurrentMapping, value: mapping},
          ],
        }), TranslateService,
        {provide: MapService, useValue: mockMapService}],
      declarations: [NotesListComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotesListComponent);
    component = fixture.componentInstance;
    const row = {
      id: '1', noMap: false, sourceCode: new SourceCode('code', 'display',
        new Source(), '1'), status: 'DRAFT'
    } as MapRow;
    component.newNote = new Note(null, '', new User(), '', '', row);
    fixture.detectChanges();
  });

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

  it('should show send button - enabled', () => {
    expect(component.newNote).toBeTruthy();
    if (component.newNote) {
      component.newNote.noteText = 'tests';
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.querySelector('#notes button').disabled).toBeFalsy();
    }
  });
});
