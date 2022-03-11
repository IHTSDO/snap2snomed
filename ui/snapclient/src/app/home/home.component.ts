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

import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {IAppState} from '../store/app.state';
import {selectAuthState, selectAuthUser} from '../store/auth-feature/auth.selectors';
import {User} from '../_models/user';
import {MatMenuTrigger} from '@angular/material/menu';
import {LoadUser, LogOut} from '../store/auth-feature/auth.actions';
import {TranslateService} from '@ngx-translate/core';
import {APP_CONFIG, AppConfig} from '../app.config';
import {ErrorInfo} from '../errormessage/errormessage.component';
import {AuthService} from '../_services/auth.service';
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {AcceptTermsComponent} from "../accept-terms/accept-terms.component";
import {IAuthState} from "../store/auth-feature/auth.reducer";


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentUser: User | null | undefined;
  userCheck = 0;
  error: ErrorInfo = {};
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger | undefined;
  title: string;
  isAdmin = false;
  termDialogRef: (null|MatDialogRef<AcceptTermsComponent>) = null;

  constructor(@Inject(APP_CONFIG) private config: AppConfig,
              public translate: TranslateService,
              public authService: AuthService,
              private store: Store<IAppState>,
              public dialog: MatDialog) {
    this.title = this.config.appName;
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    const self = this;
    self.loadUser();
  }

  /**
   * LoadUser - Home component (router-outlet)
   *
   * We need to check that the user is authenticated (via external service)
   * and registered in the db (our API) => currentuser
   * and the token hasn't expired (refresh token)
   * 1. If currentuser hasn't been loaded (first login), dispatch LoadUser to db on success (via auth.effects)
   * 2. If authenticated and currentuser, check currentuser as a one-time check to db to make sure it's valid
   * 3. If the session has expired without navigation, any CRUD operations will return a 403 (unauth) and show error
   * 4. the HttpInterceptor will catch a 403, send a request for a token refresh and return the router.url on success
   * then token is loaded into the header via httpinterceptor
   * @private
   */
  private loadUser(): void {
    const self = this;
    self.store.select(selectAuthState).subscribe((state) => {
        if (state && state.isAuthenticated) {
          self.currentUser = state.currentuser;
          if ((self.termDialogRef == null || self.termDialogRef.getState() != 0) &&
            self.currentUser && self.termsCheck()) {
            self.termDialogRef = self.dialog.open(AcceptTermsComponent);
            self.termDialogRef.afterClosed().subscribe(result => {
              if (!result) {
                self.logOut();
              } else {
                self.authService.acceptTerms()
                  .subscribe(() => {
                  this.userCheck = 0;
                  self.handleLogIn(state);
                });
              }
            });
          } else {
            self.handleLogIn(state);
          }
        }
      }
      ,
      (error) => self.translate.get('ERROR.NO_CURRENT_USER').subscribe((res: string) => {
        self.error.message = res;
      })
    );
  }

  private handleLogIn(state: IAuthState) {
    if (state.user && this.userCheck === 0) {
      this.userCheck++;
      this.store.dispatch(new LoadUser({user: state.user, navigation: !this.currentUser}));
    }

    if (state.errorMessage) {
      this.translate.get('ERROR.SERVER').subscribe((res: string) => {
        this.error.message = res;
        this.error.detail = state.errorMessage.error;
      });
    }
  }

  logOut(): void {
    this.store.dispatch(new LogOut());
  }

  /**
   * onActivate is called as child components are loaded
   * - here we pass the (validated) currentUser through
   * so each component doesn't need to separately load it
   * @param component any child component with a 'currentUser' property
   */
  onActivate(component: any): void {
    component.currentUser = this.currentUser;
  }

  openUserGuide(): void {
    window.open(this.config.userGuideUrl, '_blank');
  }

  termsCheck() {
    const authTokenExpired = this.authService.isTokenExpired();
    if (this.currentUser == null || authTokenExpired) {
      return false;
    }
    let currentVersion = Number.isNaN(this.config.currentTermsVersion) ?
      Number(0) : Number.isInteger(this.config.currentTermsVersion) ?
        Number.parseInt(this.config.currentTermsVersion) : Number.parseFloat(this.config.currentTermsVersion);
    let currentAcceptedVersion = (this.currentUser != null && this.currentUser.acceptedTermsVersion != null &&
      Number(this.currentUser.acceptedTermsVersion)) ? Number(this.currentUser.acceptedTermsVersion) : 0;
    return currentAcceptedVersion < currentVersion;
  }
}
