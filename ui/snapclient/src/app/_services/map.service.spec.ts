import {TestBed} from '@angular/core/testing';

import {MapService} from './map.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../store/app.state';
import { APP_CONFIG } from '../app.config';

describe('MapService', () => {
  let service: MapService;

  const initialState = initialAppState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        { provide: APP_CONFIG, useValue: {} },
        provideMockStore({initialState}), MapService],
    });
    service = TestBed.inject(MapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
