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
import { provideMockStore } from '@ngrx/store/testing';
import { APP_CONFIG } from 'src/app/app.config';
import { initialAppState } from 'src/app/store/app.state';
import { selectSelectedRows } from 'src/app/store/mapping-feature/mapping.selectors';

import { MappingTableSelectorComponent } from './mapping-table-selector.component';

describe('MappingTableSelectorComponent', () => {
  let component: MappingTableSelectorComponent;
  let fixture: ComponentFixture<MappingTableSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MappingTableSelectorComponent ],
      providers: [
        {provide: APP_CONFIG, useValue: {}},
        provideMockStore({
          initialState: initialAppState,
          selectors: [
            {selector: selectSelectedRows, value: ['1', '2']}
          ],
        })],

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MappingTableSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
