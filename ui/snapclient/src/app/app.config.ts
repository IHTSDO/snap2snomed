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
}

export let APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
