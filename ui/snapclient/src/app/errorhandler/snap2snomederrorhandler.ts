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

import { ErrorHandler, Inject, Injectable, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AppConfig, APP_CONFIG } from '../app.config';
import { ErrorNotifier } from './errornotifier';
import { TranslateService } from '@ngx-translate/core';
import * as Sentry from '@sentry/angular';

interface IErrorMessage {
  status: number;
  message: string;
}

interface IErrorMessageMap {
  url: string;
  errors: IErrorMessage[];
}


@Injectable({
  providedIn: 'root'
})
export class Snap2SnomedErrorHandler implements ErrorHandler {

  private errorMessageMap: IErrorMessageMap[];
  private defaultMessages: IErrorMessageMap = {
      url : 'defaultUrl',
      errors : [
        // this.defaultMessages.errors[0]
        { status: 0, message: 'ERROR.SERVICE_UNAVAILABLE' },
        // this.defaultMessages.errors[1] - this is the default error for getDefaultErrorMessage
        { status: -1, message: 'ERROR.SERVICE_ISSUES' }
      ]
  };

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private errorNotifier: ErrorNotifier,
    private translateService: TranslateService,
    private zone: NgZone) {
      // This map contains the error messages for backend/fhir services and other urls
      // The errors array holds the error messages for specific error status codes
      // Status 0 comes back when the url cannot be resolved
      // We use -1 for catch all and will be given if there is no message listed for
      // a specific status code.
      this.errorMessageMap = [
        // Default error messages for unknown services
        this.defaultMessages,
        // Backend error messages
        {
          url: this.config.apiBaseUrl,
          errors: [
            { status: 0, message: 'ERROR.BACKEND_UNAVAILABLE'},
            { status: -1, message: 'ERROR.BACKEND_ISSUES'},
            { status: 401, message: ''}, // Don't throw error message, taken care by the token-refresh
            { status: 403, message: 'ERROR.LOGIN_REQUIRED'}
          ]
        },
        // FHIR service error messages
        {
          url: this.config.fhirBaseUrl,
          errors: [
            { status: 0, message: 'ERROR.FHIR_SERVER_UNAVAILABLE' },
            { status: -1, message: 'ERROR.FHIR_SERVER_ISSUES'}
          ]
        }
      ];
  }

  handleError(error: any): void {

    this.logErrorToSentry(error);

    // Backend/FHIR/Cognito and other http errors will be processed
    if (error instanceof HttpErrorResponse) {
      const errorMsg = this.backendError(error.url, error.status);
      // Only show error notification if we have an error message
      if (errorMsg !== '') {
        this.errorNotifier.showError(errorMsg);
      }
    }
    console.error(error);
  }

  protected backendError(backendUrl: string | null, errorStatus: number): string {
    const matchedUrls = this.errorMessageMap.filter((error) => {
      return backendUrl?.indexOf(error.url) !== -1;
    });
    if (matchedUrls.length !== 0 ) {
      return '';
    } else {
      return this.translateError(this.getMessageByStatus(this.defaultMessages, errorStatus));
    }
  }

  protected translateError(id: string): string {
    if (id === '') {
      return '';
    }
    let msg = '';
    this.translateService.get(id).subscribe((res) => msg = res);
    return msg;
  }

  protected getMessageByStatus(errorMap: IErrorMessageMap, errorStatus: number): string{
    let errorMessage = '';
    const matchedStatus = errorMap.errors.filter((messages) => {
      return messages.status === errorStatus;
    });
    if (matchedStatus.length !== 0) {
      // Get the message for the specific status
      errorMessage = matchedStatus[0].message;
    } else {
      // Didn't find a message for the specific status get the message for status -1
      errorMessage = this.getDefaultErrorMessage(errorMap);
    }
    return errorMessage;
  }

  protected getDefaultErrorMessage(errorMap: IErrorMessageMap): string {
    const matchedStatus = errorMap.errors.filter((messages) => {
      return messages.status === -1;
    });
    if (matchedStatus.length !== 0) {
      return matchedStatus[0].message;
    }
    // Shouldn't happen but in case we could not get the default error message
    // we will return ERROR.SERVICE_ISSUES
    return this.defaultMessages.errors[1].message;
  }

  protected logErrorToSentry(error: any): void {
    // Log error to sentry
    if (error instanceof HttpErrorResponse) {
      // Don't report 4XX errors to Sentry
      if (error.status >= 400 && error.status < 500 ) {
        return;
      }
    }
    const eventId = this.zone.runOutsideAngular(() => Sentry.captureException(error));
    if (this.config.sentryDialog) {
      Sentry.showReportDialog({ eventId });
    }
  }
}
