import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
// import { LocalStorage } from './local-storage';
import { url } from './url';
import { find } from 'underscore';
import { LoaderService } from '../../Services/loader.service';
import { environment } from '../../../environments/environment.dev';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  private arrDownloadApi = [] as Array<string>;
  // private arrUnauthApi = [url.auth.login, url.auth.logout] as Array<string>;
  // constructor(private localStorage: LocalStorage) {}
  constructor(private loaderService: LoaderService) { }
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    this.loaderService.show();
    request = request.clone({
      setHeaders: {
        Accept: 'application/json',
        source: 'web',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    // if (!this.arrUnauthApi.includes(request.url)) {
    //   request = request.clone({
    //     setHeaders: {
    //       Authorization: 'Bearer ' + this.localStorage.token,
    //     },
    //   });
    // }
    const isDownloadUrl = find(request.url.split('/'), (v: any) => {
      return this.arrDownloadApi.includes(v);
    });
    if (isDownloadUrl) {
      request = request.clone({
        responseType: 'blob',
      });
    }

    if (!/^(http|https):/i.test(request.url)) {
      request = request.clone({ url: environment.serverUrl + request.url });
    }
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        throw error;
      }),
      finalize(() => {
        this.loaderService.hide(); // Hide the loader
      })
    );
  }
}
