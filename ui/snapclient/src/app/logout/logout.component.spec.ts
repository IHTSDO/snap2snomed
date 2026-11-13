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

import {LogoutComponent} from './logout.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {APP_CONFIG} from '../app.config';
import {provideMockStore} from '@ngrx/store/testing';
import {AuthService} from '../_services/auth.service';
import {initialAppState} from '../store/app.state';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('LogoutComponent', () => {
  let component: LogoutComponent;
  let fixture: ComponentFixture<LogoutComponent>;
  const initialState = initialAppState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [LogoutComponent],
    imports: [],
    providers: [
        { provide: APP_CONFIG, useValue: {} },
        provideMockStore({ initialState }), AuthService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
