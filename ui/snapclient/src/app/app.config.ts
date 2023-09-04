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

import { InjectionToken } from '@angular/core';
import { logging } from 'protractor';

/**
 *
 *  This is the application's configuration template.
 *  The fields meed tp match backend API's /config call
 *
 */

export interface AppConfig {
  adminGroup: string;
  apiBaseUrl: string;
  appName: string;
  authClientID: string;
  authDomainUrl: string;
  authLoginGrantType: string;
  authLoginResponseType: string;
  authLoginScope: string;
  defaultLang: string;
  fhirBaseUrl: string;
  maxFileSize: number;
  production: boolean;
  sentryDsn: string;
  sentryEnvironment: string;
  sentryRelease: string;
  sentryDialog: boolean;
  userRegistrationUrl: string;
  registrationText: string;
  mainPageText: string;
  userGuideUrl: string;
  termsOfServiceUrl: string;
  privacyPolicyUrl: string;
  currentTermsVersion: string;
  identityProvider: string;
}

export let APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
