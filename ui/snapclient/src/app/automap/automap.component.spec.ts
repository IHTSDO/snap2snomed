/*
 * Copyright © 2022 SNOMED International
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutomapComponent } from './automap.component';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {DebugElement} from '@angular/core';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpLoaderFactory} from '../app.module';
import {FhirService} from '../_services/fhir.service';
import {APP_CONFIG} from '../app.config';

describe('AutomapComponent', () => {
  let component: AutomapComponent;
  let fixture: ComponentFixture<AutomapComponent>;
  let translateService: TranslateService;
  let fhirService: FhirService;
  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule,
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MatDialogModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })],
      providers: [{provide: MatDialogRef, useValue: mockDialogRef},
        TranslateService, FhirService, { provide: APP_CONFIG, useValue: {} }],
      declarations: [ AutomapComponent ]
    })
    .compileComponents();
    translateService = TestBed.inject(TranslateService);
    fhirService = TestBed.inject(FhirService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutomapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
