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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {HttpLoaderFactory} from 'src/app/app.module';
import {Mapping} from 'src/app/_models/mapping';
import {Project} from 'src/app/_models/project';
import {LastupdatedPipe} from 'src/app/_utils/lastupdated_pipe';

import { MappingDetailsCardComponent } from './mapping-details-card.component';

describe('MappingDetailsCardComponent', () => {
  let component: MappingDetailsCardComponent;
  let fixture: ComponentFixture<MappingDetailsCardComponent>;

  const mapping = new Mapping();
  mapping.project.maps.push(mapping);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })
      ],
      declarations: [
        MappingDetailsCardComponent,
        LastupdatedPipe
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    const project = mapping.project;
    project.id = '1';
    project.title = 'Test Map';

    mapping.id = '2';
    mapping.mapVersion = 'V1.0';

    fixture = TestBed.createComponent(MappingDetailsCardComponent);
    component = fixture.componentInstance;
    component.mapping = mapping;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show Map title', () => {
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('h2'));
    expect(el.nativeElement.textContent).toBe('Test Map');
    expect(el).toBeTruthy();
  });

});
