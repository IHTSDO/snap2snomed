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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from 'src/app/app.config';
import { HttpLoaderFactory } from 'src/app/app.module';
import { ErrormessageComponent } from 'src/app/errormessage/errormessage.component';

import { BulkchangeComponent } from './bulkchange.component';

describe('BulkchangeComponent', () => {
  let component: BulkchangeComponent;
  let fixture: ComponentFixture<BulkchangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MatDialogModule,
        MatButtonModule,
        MatDividerModule,
        MatRadioModule,
        MatCardModule,
        MatCheckboxModule,
        FormsModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatInputModule,
        MatSelectModule,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })
      ],
      providers: [
        {provide: MatDialogRef, useValue: {}},
        {provide: MAT_DIALOG_DATA, useValue: {selectedRows: ['a']}},
        {provide: APP_CONFIG, useValue: {}},
        MatSnackBar,
        TranslateService],
      declarations: [ BulkchangeComponent,
                      ErrormessageComponent,
                      MatLabel ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BulkchangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show warning if mapview is set', () => {
    component.isMapView = true;
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.alert-warning'));
    expect(el).toBeTruthy();
  });

  it('should show header for selections', () => {
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.mat-dialog-title'));
    expect(el.nativeElement.textContent).toContain('BULKCHANGEDIALOG.SELECTED');
  });

  it('should show header for all', () => {
    component.changeType = 'ALL';
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.mat-dialog-title'));
    expect(el.nativeElement.textContent).toContain('BULKCHANGEDIALOG.ALL');
  });

  it('should hide relationship and status selection - on clear no map', () => {
    component.setClearNoMap(true);
    fixture.detectChanges();
    let el = fixture.debugElement.query(By.css('.alert-warning'));
    expect(el).toBeTruthy();
    el = fixture.debugElement.query(By.css('.mat-form-field'));
    expect(el).toBeFalsy();
    el = fixture.debugElement.query(By.css('button.mat-primary'));
    expect(el.attributes['ng-reflect-disabled']).toEqual('false');
  });

  it('should hide relationship selection and disable status - on no map', () => {
    component.setNoMap(true);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.alert-warning'));
    expect(el).toBeTruthy();
    const el1 = fixture.debugElement.query(By.css('#relationships'));
    expect(el1).toBeFalsy();
    const el2 = fixture.debugElement.query(By.css('#statuses'));
    expect(el2.classes['mat-form-field-disabled']).toBeTruthy();
    const el3 = fixture.debugElement.query(By.css('button.mat-primary'));
    console.log(el3.attributes['ng-reflect-disabled']);
    expect(el3.attributes['ng-reflect-disabled']).toEqual('false');
  });

  it('should hide relationship and status selection - on clear targets', () => {
    component.clearTarget = true;
    component.clearTargetClicked(true);
    fixture.detectChanges();
    let el = fixture.debugElement.query(By.css('.alert-warning'));
    expect(el).toBeTruthy();
    el = fixture.debugElement.query(By.css('.mat-form-field'));
    expect(el).toBeFalsy();
    el = fixture.debugElement.query(By.css('button.mat-primary'));
    expect(el.attributes['ng-reflect-disabled']).toEqual('false');
  });

  it('should enable ok when selecting relationship', () => {
    component.changedRelationship='EQUIVALENT';
    fixture.detectChanges();
    let el = fixture.debugElement.query(By.css('button.mat-primary'));
    expect(el.attributes['ng-reflect-disabled']).toEqual('false');
  });

  it('should enable ok when selecting status', () => {
    component.changedStatus='MAPPED';
    fixture.detectChanges();
    let el = fixture.debugElement.query(By.css('button.mat-primary'));
    expect(el.attributes['ng-reflect-disabled']).toEqual('false');
  });

});
