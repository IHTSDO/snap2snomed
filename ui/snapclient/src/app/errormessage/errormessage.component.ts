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
