import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ConceptSearchComponent} from './concept-search.component';
import {APP_CONFIG} from '../app.config';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../store/app.state';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../app.module';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';

describe('ConceptSearchComponent', () => {
  let component: ConceptSearchComponent;
  let fixture: ComponentFixture<ConceptSearchComponent>;
  let el: DebugElement;

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
      declarations: [ConceptSearchComponent]
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

    fixture.whenStable().then(() => {
      expect(component.searchControl.value).toBe('');
    });
  });


});
