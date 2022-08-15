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
import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {RouterTestingModule} from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {HttpLoaderFactory} from 'src/app/app.module';
import { initialAppState } from 'src/app/store/app.state';
import {Mapping} from 'src/app/_models/mapping';
import {LastupdatedPipe} from 'src/app/_utils/lastupdated_pipe';

import { MappingDetailsCardComponent } from './mapping-details-card.component';

describe('MappingDetailsCardComponent', () => {
  let component: MappingDetailsCardComponent;
  let fixture: ComponentFixture<MappingDetailsCardComponent>;
  let mapping: Mapping;
  let secondMapping: Mapping;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([]),
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
        provideMockStore({initialState: initialAppState}),
      ],
      declarations: [
        MappingDetailsCardComponent,
        LastupdatedPipe
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {

    mapping = new Mapping();
    mapping.project.maps.push(mapping);

    const project = mapping.project;
    project.id = '1';
    project.title = 'Test Map';

    mapping.id = '2';
    mapping.mapVersion = 'V1.0';

    secondMapping = new Mapping();
    secondMapping.id = '3';
    secondMapping.mapVersion = 'V2.1';

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

  it('should show version number', () => {
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('#map-version-select'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent.trim()).toBe('V1.0');
  });

  it('should show version number in drop down', () => {
    const select = fixture.debugElement.query(By.css('#map-version-select')).nativeElement;
    select.click();
    fixture.detectChanges();
    const versionOptions = fixture.debugElement.queryAll(By.css('mat-option'));
    expect(versionOptions.length).toEqual(1);
    expect(versionOptions[0].nativeElement.textContent.trim()).toBe('V1.0');
  });

  it('should have multiple versions in dropdown', () => {
    mapping.project.maps.push(secondMapping);

    const select = fixture.debugElement.query(By.css('#map-version-select')).nativeElement;
    select.click();
    fixture.detectChanges();
    const versionOptions = fixture.debugElement.queryAll(By.css('mat-option'));
    expect(versionOptions.length).toEqual(2);
    expect(versionOptions[0].nativeElement.textContent.trim()).toBe('V1.0');
    expect(versionOptions[1].nativeElement.textContent.trim()).toBe('V2.1');
  });

  it('should execute the component method on change', fakeAsync(() => {
    const select = fixture.debugElement.query(By.css('#map-version-select')).nativeElement;
    fixture.detectChanges();
    spyOn(component, 'versionSelectionChange');
    select.dispatchEvent(new Event('selectionChange'));
    tick();
    expect(component.versionSelectionChange).toHaveBeenCalled();
  }));  

});
