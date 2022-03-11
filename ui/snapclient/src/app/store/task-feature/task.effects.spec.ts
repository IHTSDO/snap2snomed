import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Observable} from 'rxjs';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../app.state';
import {TaskEffects} from './task.effects';
import {APP_CONFIG} from '../../app.config';
import {testRoutes} from '../../auth.guard.spec';


describe('TaskEffects', () => {
  let actions$: Observable<any>;
  let effects: TaskEffects;

  const initialState = initialAppState;
  const routes = testRoutes;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(routes),
        HttpClientTestingModule
      ],
      providers: [
        { provide: APP_CONFIG, useValue: {} },
        TaskEffects,
        provideMockActions(() => actions$),
        provideMockStore({initialState})
      ]
    });

    effects = TestBed.inject(TaskEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
