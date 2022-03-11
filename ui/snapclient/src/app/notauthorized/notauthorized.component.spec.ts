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
