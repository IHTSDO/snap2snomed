import {TestBed} from '@angular/core/testing';

import {SourceNavigationService} from './source-navigation.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {APP_CONFIG} from '../app.config';
import {provideMockStore} from '@ngrx/store/testing';
import {SourceService} from './source.service';
import {initialAppState} from '../store/app.state';

describe('SourceNavigationService', () => {
  let service: SourceNavigationService;
  const initialState = initialAppState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        { provide: APP_CONFIG, useValue: {} },
        provideMockStore({initialState}), SourceService],
    });
    service = TestBed.inject(SourceNavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
