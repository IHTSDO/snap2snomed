import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TargetRowsComponent } from './target-rows.component';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../../app.module';
import {APP_CONFIG} from '../../app.config';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {IAppState, initialAppState} from '../../store/app.state';
import {DebugElement} from '@angular/core';

describe('TargetRowsComponent', () => {
  let component: TargetRowsComponent;
  let fixture: ComponentFixture<TargetRowsComponent>;
  let el: DebugElement;
  let translateService: TranslateService;
  let store: MockStore<IAppState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTooltipModule,
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
      declarations: [ TargetRowsComponent ]
    })
    .compileComponents();
    store = TestBed.inject(MockStore);
    translateService = TestBed.inject(TranslateService);
    fixture = TestBed.createComponent(TargetRowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
