import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {APP_CONFIG} from 'src/app/app.config';
import {HttpLoaderFactory} from 'src/app/app.module';
import {initialAppState} from 'src/app/store/app.state';

import {ConceptAutosuggestComponent} from './concept-autosuggest.component';

describe('ConceptAutosuggestComponent', () => {
  let component: ConceptAutosuggestComponent;
  let fixture: ComponentFixture<ConceptAutosuggestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })
      ],
      providers: [TranslateService, {provide: APP_CONFIG, useValue: {}},
        provideMockStore({initialState: initialAppState})],
      declarations: [ ConceptAutosuggestComponent ]
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
