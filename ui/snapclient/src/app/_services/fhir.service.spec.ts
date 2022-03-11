import {TestBed} from '@angular/core/testing';

import {FhirService} from './fhir.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../store/app.state';
import { APP_CONFIG } from '../app.config';

describe('FhirService', () => {
  let service: FhirService;

  const initialState = initialAppState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        provideMockStore({initialState}),
        FhirService,
        { provide: APP_CONFIG, useValue: {} }],
    });
    service = TestBed.inject(FhirService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
