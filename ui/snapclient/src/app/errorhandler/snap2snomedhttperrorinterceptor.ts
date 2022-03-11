import {Inject, Injectable, NgZone} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor,
        HttpRequest} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AppConfig, APP_CONFIG} from '../app.config';
import {ErrorNotifier} from './errornotifier';
import {Snap2SnomedErrorHandler} from './snap2snomederrorhandler';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class Snap2SnomedHttpErrorInterceptor implements HttpInterceptor {

  constructor(private snap2SnomedErrorHandler: Snap2SnomedErrorHandler) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error) => {
        this.snap2SnomedErrorHandler.handleError(error);
        return throwError(error);
      })
    );
  }

}
