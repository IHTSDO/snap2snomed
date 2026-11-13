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
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {APP_CONFIG} from '../app.config';
import {HttpLoaderFactory} from '../app.module';
import {SelectionService} from '../_services/selection.service';

import { TreeViewComponent } from './tree-view.component';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatTreeModule } from '@angular/material/tree';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

describe('TreeViewComponent', () => {
  let component: TreeViewComponent;
  let fixture: ComponentFixture<TreeViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [TreeViewComponent],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
      MatTreeModule,
      MatCardModule,
      MatIconModule,
      MatButtonModule,
      TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        })],
    providers: [TranslateService, SelectionService,
        { provide: APP_CONFIG, useValue: {} }, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting(),]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
