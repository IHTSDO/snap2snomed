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

import { ComponentFixture, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { AuthService } from './_services/auth.service';
import { UserService } from './_services/user.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, DebugElement } from '@angular/core';
import { IAppState, initialAppState } from './store/app.state';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { HttpLoaderFactory } from './app.module';
import { APP_CONFIG } from './app.config';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { selectAuthState } from './store/auth-feature/auth.selectors';

export class TranslateServiceStub {

  public get(key: any): any {
    of(key);
  }

  public getBrowserLang(): any {
    return 'en';
  }

  public addLangs(langs: string[]): any {
    return langs.map((m) => m);
  }

  public setDefaultLang(lang: string): string {
    return lang;
  }

  public use(lang: string): string {
    return lang;
  }
}

describe('AppComponent', () => {
  let app: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let testAuthService: AuthService;
  let testUserService: UserService;

  let translateService: TranslateService;
  let store: MockStore<IAppState>;
  let el: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        })],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: {}, params: of({}), queryParams: of({}), data: of({})} },
        { provide: APP_CONFIG, useValue: { appName: 'Snap2SNOMED', authDomainUrl: 'anything' } },
        provideRouter([]),
        provideMockStore({
          initialState: initialAppState,
          selectors: [{ selector: selectAuthState, value: initialAppState.auth }]
        }), AuthService, UserService,
        { provide: TranslateService, useClass: TranslateServiceStub },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore);
    testAuthService = TestBed.inject(AuthService);
    testUserService = TestBed.inject(UserService);
    translateService = TestBed.inject(TranslateService);

    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    app.translate = translateService;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Snap2SNOMED'`, () => {
    expect(app.title).toEqual('Snap2SNOMED');
  });

  it(`should inject auth service`, inject([AuthService], async (injectService: AuthService) => {
    expect(injectService).toBe(testAuthService);
  }));

  it(`should inject user service`, inject([UserService], async (injectService: UserService) => {
    expect(injectService).toBe(testUserService);
  }));

  it('should render login button when user is not authenticated', () => {
    // isAuthenticated is already false from the store's initialAppState set in beforeEach.
    // A second detectChanges() is not needed and triggers NG0100 in strict mode.
    el = fixture.debugElement.query(By.css('button'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toContain('Login');
  });

  it('should not render login button when user is authenticated', fakeAsync(() => {
    // Destroy the unauthenticated fixture and set authenticated state before creating a new
    // component. ngOnInit then subscribes with isAuthenticated=true on the very first render,
    // so there is no false→true transition mid-cycle that would trigger NG0100.
    fixture.destroy();
    store.overrideSelector(selectAuthState, { isAuthenticated: true, user: null, currentuser: null, errorMessage: null });
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    app.translate = translateService;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const el = fixture.debugElement.query(By.css('button.login'));

    expect(el).toBeNull();
  }));

});
