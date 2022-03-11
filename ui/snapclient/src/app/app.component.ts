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

import {Component, Inject, OnInit} from '@angular/core';
import {AuthService} from './_services/auth.service';
import {UserService} from './_services/user.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {IAppState} from './store/app.state';
import {LogIn} from './store/auth-feature/auth.actions';
import {selectAuthState} from './store/auth-feature/auth.selectors';
import {TranslateService} from '@ngx-translate/core';
import {APP_CONFIG, AppConfig} from './app.config';
import {ErrorInfo} from './errormessage/errormessage.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  static translator: TranslateService;
  title: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasError = false;
  errorMsg: string | null = null;
  error: ErrorInfo = {};
  mainPageText: string;
  registrationText: string | null = null;
  userRegistrationUrl: string | null = null;

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              private authService: AuthService,
              private userService: UserService,
              private store: Store<IAppState>,
              public router: Router,
              private route: ActivatedRoute,
              public translate: TranslateService) {
    this.title = this.config.appName;
    this.isAuthenticated = false;
    this.isLoading = false;
    this.registrationText = this.config.registrationText;
    this.mainPageText = this.config.mainPageText;
    this.userRegistrationUrl = this.config.userRegistrationUrl
  }

  ngOnInit(): void {
    this.setupTranslator();
    this.store.select(selectAuthState).subscribe((state) => {
      this.isAuthenticated = state.isAuthenticated;
      this.hasError = state.errorMessage !== null;
      this.errorMsg = state.errorMessage?.error ? state.errorMessage.error.detail : null;
    });
    this.route.queryParams.subscribe(params => {
      const code = params.code;
      if (code && code.length > 1) {
        this.isLoading = true;
        this.store.dispatch(new LogIn(code));
      }
    });
  }

  setupTranslator(): void {
    // Set up translation service - uses i18n/*.json
    AppComponent.translator = this.translate;
    this.translate.setDefaultLang(this.config.defaultLang);
    const supportedLangs = ['en', 'fr', 'nl', 'hu'];
    const userLang = this.translate.getBrowserLang(); // TODO - Get from user profile when ready
    const lang = supportedLangs.indexOf(userLang) >= 0 ? userLang : this.config.defaultLang;
    this.translate.addLangs(supportedLangs);
    this.translate.use(lang);
  }

  showLogin(): void {
    try {
      this.authService.loginWithRedirect();
    } catch (e) {
      this.hasError = true;
      this.errorMsg = '' + e;
    }

  }
}
