import {TestBed} from '@angular/core/testing';

import {SourceService} from './source.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../store/app.state';
import { APP_CONFIG } from '../app.config';

describe('SourceService', () => {
  let service: SourceService;

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
    service = TestBed.inject(SourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
