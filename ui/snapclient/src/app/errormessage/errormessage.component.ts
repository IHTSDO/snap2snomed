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

import {Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewChecked} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ErrorNotifier} from '../errorhandler/errornotifier';
import {ErrorDetail} from '../_models/error_detail';

export interface ErrorInfo {
  message?: string;
  messages?: string[];
  detail?: ErrorDetail;
}

@Component({
  selector: 'app-errormessage',
  templateUrl: './errormessage.component.html',
  styleUrls: ['./errormessage.component.css']
})
export class ErrormessageComponent implements AfterViewChecked {
  @Input() error: ErrorInfo = {};
  @Output() closed = new EventEmitter<void>();

  // @ts-ignore
  @ViewChild('errorMessage', {static: false}) errorDiv: ElementRef<HTMLDivElement>;

  displayedColumns: string[] = ['field', 'message'];

  constructor(
    private translate: TranslateService,
    private errorNotifier: ErrorNotifier) {
  }

  ngAfterViewChecked(): void {
    if (this.errorDiv?.nativeElement.offsetParent !== null) {
      // prematurely closes the error notifier - note this code is called over 100 times on page load
      // this.errorNotifier.snackBar.dismiss();
    }
  }

  closeAlert(): void {
    this.error.message = undefined;
    this.error.messages = undefined;
    this.error.detail = undefined;

    this.closed.emit();
  }

}
