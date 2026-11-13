/*
 * Copyright © 2026 SNOMED International
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
import {TranslateModule, TranslateService} from '@ngx-translate/core';;
import {} from '@angular/common/http/testing';

import {ErrormessageComponent} from './errormessage.component';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {ErrorDetail} from '../_models/error_detail';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';

describe('ErrormessageComponent', () => {
  let component: ErrormessageComponent;
  let fixture: ComponentFixture<ErrormessageComponent>;
  let translateService: TranslateService;
  let el: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatSnackBarModule,
        MatTableModule,
        MatSortModule,
        TranslateModule.forRoot()
      ],
      providers: [TranslateService],
      declarations: [ErrormessageComponent]
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    translateService = TestBed.inject(TranslateService);
    fixture = TestBed.createComponent(ErrormessageComponent);
    component = fixture.componentInstance;

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not contain error.message when null passed', async () => {
    component.error = { messages: undefined } as any;

    fixture.detectChanges();
    
    expect(component.error.message).toBeFalsy();
  });

  it('should contain error.message when string passed', async () => {
    component.error = { message: 'something' } as any;

    fixture.detectChanges();

    expect(component.error.message).toBeTruthy();
  });

  it('should not contain error.messages when null passed', async () => {
    component.error = { messages: undefined } as any;

    fixture.detectChanges();

    expect(component.error.messages).toBeFalsy();
  });

  it('should contain error.messages when array passed', async () => {
    component.error = { messages: ['something', 'something else'] } as any;

    fixture.detectChanges();

    expect(component.error.messages).toBeTruthy();
  });

  it('should contain close button when error showing', async () => {
    component.error = { message: 'something' } as any;

    fixture.detectChanges();

    el = fixture.debugElement.query(By.css('.close-alert')).nativeElement;
    expect(el).toBeTruthy();
  });

  it('should not contain detail when error showing but no error.detail', async () => {
    component.error = { message: 'something' } as any;

    fixture.detectChanges();

    el = fixture.debugElement.query(By.css('p#detailMessage'));
    expect(el).toBeFalsy();
  });

  it('should contain detail when error.detail available', async () => {
    component.error = {
      message: 'something',
      detail: new ErrorDetail()
    } as any;

    fixture.detectChanges();

    el = fixture.debugElement.query(By.css('p#detailMessage')).nativeElement;
    expect(el).toBeTruthy();
  });

  it('should contain detail table when error.detail violations available', async () => {
    component.error = {
      message: 'something',
      detail: {
        violations: [
          {
            field: 'field[0].subfield',
            message: 'value must be supplied'
          }
        ]
      }
    } as any;

    fixture.detectChanges();
    
    el = fixture.debugElement.query(By.css('table#violations')).nativeElement;
    expect(el).toBeTruthy();
  });

});
