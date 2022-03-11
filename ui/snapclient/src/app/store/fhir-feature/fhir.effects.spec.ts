import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable} from 'rxjs';

import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../app.state';
import {FhirEffects} from './fhir.effects';
import { APP_CONFIG } from '../../app.config';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../../app.module';
import {testRoutes} from '../../auth.guard.spec';

describe('FhirEffects', () => {
  let actions$: Observable<any>;
  let effects: FhirEffects;
  let translateService: TranslateService;

  const initialState = initialAppState;
  const routes = testRoutes;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(routes),
        HttpClientTestingModule,
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
        FhirEffects,
        provideMockActions(() => actions$),
        provideMockStore({initialState})
      ]
    });
    translateService = TestBed.inject(TranslateService);
    effects = TestBed.inject(FhirEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
