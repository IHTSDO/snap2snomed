import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable} from 'rxjs';

import {MappingEffects} from './mapping.effects';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../app.state';
import { APP_CONFIG } from '../../app.config';
import {RouterTestingModule} from '@angular/router/testing';

describe('MappingEffects', () => {
  let actions$: Observable<any>;
  let effects: MappingEffects;

  const initialState = initialAppState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: APP_CONFIG, useValue: {} },
        MappingEffects,
        provideMockActions(() => actions$),
        provideMockStore({initialState})
      ]
    });

    effects = TestBed.inject(MappingEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
