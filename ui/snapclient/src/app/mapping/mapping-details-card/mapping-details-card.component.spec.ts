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
import { APP_CONFIG } from 'src/app/app.config';
import {HttpLoaderFactory} from 'src/app/app.module';
import { selectAuthorizedProjects } from 'src/app/store/app.selectors';
import { initialAppState } from 'src/app/store/app.state';
import {Mapping} from 'src/app/_models/mapping';
import { Project } from 'src/app/_models/project';
import {LastupdatedPipe} from 'src/app/_utils/lastupdated_pipe';

import { MappingDetailsCardComponent } from './mapping-details-card.component';

describe('MappingDetailsCardComponent', () => {
  let component: MappingDetailsCardComponent;
  let fixture: ComponentFixture<MappingDetailsCardComponent>;
  let mapping: Mapping;
  let secondMapping: Mapping;
  let project: Project;


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
        {provide: APP_CONFIG, useValue: {appName: 'Snap2SNOMED', authDomainUrl: 'anything'}},
        provideMockStore({
          initialState: initialAppState,
          selectors: [
            {
              selector: selectAuthorizedProjects,
              value: {project: project},
            }
          ],}),
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
    mapping.id = '2';
    mapping.mapVersion = 'V1.0';

    project = mapping.project;
    project.id = '1';
    project.title = 'Test Map';
    project.dualMapMode = false;

    mapping.project.maps.push(mapping);

    secondMapping = new Mapping();
    secondMapping.id = '3';
    secondMapping.mapVersion = 'V2.1';
    secondMapping.project = mapping.project;
    secondMapping.project.maps.push(secondMapping);

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
    expect(el.nativeElement.textContent).toBe('Test Map - (MAP.SINGLE_MAP)');
    expect(el).toBeTruthy();
  });

  it('should show version number', () => {
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('#map-version-select'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent.trim()).toContain('V1.0');
  });

  it('should show version number in drop down', () => {
    const select = fixture.debugElement.query(By.css('#map-version-select')).nativeElement;
    select.click();
    fixture.detectChanges();
    const versionOptions = fixture.debugElement.queryAll(By.css('mat-option'));
    expect(versionOptions.length).toEqual(2);
    expect(versionOptions[0].nativeElement.textContent.trim()).toContain('V1.0');
  });

  it('should have multiple versions in dropdown', () => {
    const select = fixture.debugElement.query(By.css('#map-version-select')).nativeElement;
    select.click();
    fixture.detectChanges();
    const versionOptions = fixture.debugElement.queryAll(By.css('mat-option'));
    expect(versionOptions.length).toEqual(2);
    expect(versionOptions[0].nativeElement.textContent.trim()).toContain('V1.0');
    expect(versionOptions[1].nativeElement.textContent.trim()).toContain('V2.1');
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
