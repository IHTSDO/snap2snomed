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

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FooterComponent} from './footer.component';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {APP_CONFIG} from "../app.config";
import {MAT_DIALOG_DATA, MatDialogModule} from "@angular/material/dialog";
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpLoaderFactory } from '../app.module';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
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
        TranslateService, { provide: APP_CONFIG, useValue: {} }
      ],
      declarations: [FooterComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have footer links', () => {
    const el: DebugElement = fixture.debugElement.query(By.css('.footer-link'));
    const expectedUrl = 'http://www.snomed.org';
    expect(el.nativeElement.textContent).toBe('FOOTER.COPYRIGHT_SNOMED_INTERNATIONAL');
    expect(el.nativeElement.getAttribute('href')).toBe(expectedUrl);
  });
});
