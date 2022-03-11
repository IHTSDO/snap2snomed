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

import {ComponentFixture, inject, TestBed} from '@angular/core/testing';
import {HomeComponent} from './home.component';
import {RouterTestingModule} from '@angular/router/testing';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {HttpLoaderFactory} from '../app.module';
import {AuthService} from '../_services/auth.service';
import {UserService} from '../_services/user.service';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {User} from '../_models/user';
import {IAppState, initialAppState} from '../store/app.state';
import {selectAuthState, selectCurrentUserError} from '../store/auth-feature/auth.selectors';
import {APP_CONFIG} from '../app.config';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from "@angular/material/dialog";


describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let authService: AuthService;
  let userService: UserService;
  let translateService: TranslateService;
  let http: HttpTestingController;
  let store: MockStore<IAppState>;

  const user = new User();
  user.givenName = 'Jo';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        MatMenuModule,
        MatIconModule,
        MatDialogModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })
      ],
      providers: [
        {provide: APP_CONFIG, useValue: {} },
        {provide: MAT_DIALOG_DATA, useValue: {}},
        {provide: MatDialogRef, useValue: {}},
        provideMockStore({
        initialState: initialAppState,
        selectors: [
          {selector: selectCurrentUserError, value: 'MockError'},
          {selector: selectAuthState, value: {isAuthenticated: true, user, errorMessage: null}},
        ],
      }), AuthService, UserService, TranslateService],
      declarations: [HomeComponent]
    }).compileComponents();
    authService = TestBed.inject(AuthService);
    userService = TestBed.inject(UserService);
    translateService = TestBed.inject(TranslateService);
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(MockStore);

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it(`should inject auth service`, inject([AuthService], async (injectService: AuthService) => {
      expect(injectService).toBe(authService);
    })
  );

  it(`should inject user service`, inject([UserService], async (injectService: UserService) => {
      expect(injectService).toBe(userService);
    })
  );

  it(`should inject translate service`, inject([TranslateService], async (injectService: TranslateService) => {
      expect(injectService).toBe(translateService);
    })
  );

  it('should show ADMIN tag', () => {
    expect(component.isAdmin).toBeFalse();
    component.isAdmin = true;
    fixture.detectChanges();
    const el: DebugElement = fixture.debugElement.query(By.css('.text-danger'));
    expect(el.nativeElement.textContent).toBe('HOME.ADMIN ');
  });

});
