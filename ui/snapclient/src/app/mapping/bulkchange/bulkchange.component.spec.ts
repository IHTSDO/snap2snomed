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

import { provideHttpClientTesting } from '@angular/common/http/testing';
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
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { APP_CONFIG } from 'src/app/app.config';
import { ErrormessageComponent } from 'src/app/errormessage/errormessage.component';
import { BulkchangeComponent } from './bulkchange.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('BulkchangeComponent', () => {
  let component: BulkchangeComponent;
  let fixture: ComponentFixture<BulkchangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BulkchangeComponent, ErrormessageComponent],
      imports: [
        MatDialogModule,
        MatLabel,
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
        MatIconModule,
        TranslateModule.forRoot() 
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { selectedRows: ['a'], isMapView: true } },
        { provide: APP_CONFIG, useValue: {} },
        MatSnackBar,
        TranslateService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(BulkchangeComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable(); // allow Angular/Material to settle
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show warning if mapview is set', async () => {
    component.isMapView = true;

    fixture.detectChanges();

    const el = fixture.debugElement.query(By.css('.alert-warning'));
    expect(el).toBeTruthy();
  });

  it('should show header for selections', async () => {
    fixture.detectChanges();

    const el = fixture.debugElement.query(By.css('.mat-mdc-dialog-title'));
    expect(el.nativeElement.textContent).toContain('BULKCHANGEDIALOG.SELECTED');
  });

  it('should hide relationship and status selection - on clear no map', async () => {
    component.setClearNoMap(true);

    fixture.detectChanges();

    let el = fixture.debugElement.query(By.css('.alert-warning'));
    expect(el).toBeTruthy();

    el = fixture.debugElement.query(By.css('.mat-mdc-form-field'));
    expect(el).toBeFalsy();

    const button = fixture.debugElement.query(By.css('button[mat-flat-button]'));
    expect(button.nativeElement.disabled).toBe(false);
  });

  it('should hide relationship selection and status - on no map', async () => {
    component.setNoMap(true);

    fixture.detectChanges();

    const el = fixture.debugElement.query(By.css('.alert-warning'));
    expect(el).toBeTruthy();

    expect(fixture.debugElement.query(By.css('#relationships'))).toBeFalsy();
    expect(fixture.debugElement.query(By.css('#statuses'))).toBeFalsy();

    const button = fixture.debugElement.query(By.css('button[mat-flat-button]'));
    expect(button.nativeElement.disabled).toBe(false);
  });

  it('should hide relationship and status selection - on clear targets', async () => {
    component.clearTarget = true;
    component.clearTargetClicked(true);

    fixture.detectChanges();

    let el = fixture.debugElement.query(By.css('.alert-warning'));
    expect(el).toBeTruthy();

    el = fixture.debugElement.query(By.css('.mat-mdc-form-field'));
    expect(el).toBeFalsy();

    const button = fixture.debugElement.query(By.css('button[mat-flat-button]'));
    expect(button.nativeElement.disabled).toBe(false);
  });

  it('should enable ok when selecting relationship', async () => {
    component.changedRelationship = 'EQUIVALENT';

    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button[mat-flat-button]'));
    expect(button.nativeElement.disabled).toBe(false);
  });

  it('should enable ok when selecting status', async () => {
    component.changedStatus = 'MAPPED';

    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button[mat-flat-button]'));
    expect(button.nativeElement.disabled).toBe(false);
  });
});