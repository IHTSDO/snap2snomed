import {ComponentFixture, TestBed} from '@angular/core/testing';

import {UserChipComponent} from './user-chip.component';
import {RouterTestingModule} from '@angular/router/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {HttpLoaderFactory} from '../../app.module';
import {APP_CONFIG} from '../../app.config';
import {provideMockStore} from '@ngrx/store/testing';
import {initialAppState} from '../../store/app.state';
import {InitialsPipe} from '../../_utils/initialize_pipe';
import {User} from '../../_models/user';
import {By} from '@angular/platform-browser';
import {GravatarComponent} from '../gravatar/gravatar.component';

describe('UserChipComponent', () => {
  let component: UserChipComponent;
  let fixture: ComponentFixture<UserChipComponent>;
  const user = new User();
  user.givenName = 'Jo';
  user.familyName = 'Smith';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTooltipModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClientTestingModule]
          }
        })
      ],
      providers: [
        {provide: APP_CONFIG, useValue: {}},
        provideMockStore({
          initialState: initialAppState,
        }), TranslateService],
      declarations: [UserChipComponent, GravatarComponent, InitialsPipe]
    })
      .compileComponents();
    fixture = TestBed.createComponent(UserChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show user initials since no email therefore no gravatar', () => {
    component.user = user;
    const expected = user.givenName[0].toUpperCase() + user.familyName[0].toUpperCase();
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('app-gravatar div'));
    expect(el.nativeElement).toBeTruthy();
    expect(el.nativeElement.textContent).toBe(expected);
  });
});
