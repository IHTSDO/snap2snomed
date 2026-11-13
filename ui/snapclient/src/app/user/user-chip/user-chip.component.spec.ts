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

import {ComponentFixture, fakeAsync, tick, TestBed} from '@angular/core/testing';

import {UserChipComponent} from './user-chip.component';
import {RouterTestingModule} from '@angular/router/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatChipsModule} from '@angular/material/chips';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../../app.module';
import {APP_CONFIG} from '../../app.config';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../../store/app.state';
import {InitialsPipe} from '../../_utils/initialize_pipe';
import {User} from '../../_models/user';
import {By} from '@angular/platform-browser';
import {GravatarComponent} from '../gravatar/gravatar.component';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('UserChipComponent', () => {
  let component: UserChipComponent;
  let fixture: ComponentFixture<UserChipComponent>;
  const user = new User();
  user.givenName = 'Jo';
  user.familyName = 'Smith';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [UserChipComponent, GravatarComponent, InitialsPipe],
    imports: [RouterTestingModule,
        BrowserAnimationsModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatChipsModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        })],
    providers: [
        { provide: APP_CONFIG, useValue: {} },
        provideMockStore({
            initialState: initialAppState,
        }), TranslateService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
})
      .compileComponents();
    fixture = TestBed.createComponent(UserChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show user initials since no email therefore no gravatar', fakeAsync(() => {
    fixture.componentRef.setInput('user', user);
    const expected = user.givenName[0].toUpperCase() + user.familyName[0].toUpperCase();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('app-gravatar div'));
    expect(el.nativeElement).toBeTruthy();
    expect(el.nativeElement.textContent).toBe(expected);
  }));
});
