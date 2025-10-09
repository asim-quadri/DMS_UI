import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class HttpService {
  public isOnline = true;

  constructor(private http: HttpClient, private router: Router) {
    this.checkConnection();
  }

  public get(url: string) {
    return this.http.get(this.getDateInUrl(url)).pipe(
      catchError((error) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  public post(url: string, body: any) {
    return this.http.post(url, body).pipe(
      catchError((error) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  public put(url: string, body: any) {
    return this.http.put(url, body).pipe(
      catchError((error) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  public delete(url: string, body: any = '') {
    return this.http.delete(url, body).pipe(
      catchError((error) => {
        return throwError(() => this.handleError(error));
      })
    );
  }

  private handleError(error: any | HttpErrorResponse) {
    console.error(
      `%c${'http'}`,
      'background: red; color: yellow; font-size: x-medium',
      error
    );
    let redirectToLogin = false;
    let isLoginPage = false;
    if (error.url) {
      const _arrKey = error.url.split('/');
      if (_arrKey[_arrKey.length - 1] === 'login') {
        isLoginPage = true;
      }
    }
    switch (error.status) {
      case 0:
        break;
      case 202: // Review Request Status
        break;
      case 301: // Moved Permanently
        break;
      case 400: // Bad Request
        break;
      case 401: // Unauthorized
        redirectToLogin = true;
        break;
      case 403: // Forbidden
        redirectToLogin = true;
        break;
      case 404: // Not Found
        break;
      case 405: // Method Not Allowed
        break;
      case 409: // already exist
        break;
      case 500: // Internal Server Error
        break;
      case 501: // Not Implemented
        break;
      case 502: // Bad Gateway
        break;
      case 503: // Service Unavailable
        break;
      case 504: // Gateway Timeout
        break;
    }
    if (isLoginPage) {
      redirectToLogin = false;
    }
    if (redirectToLogin) {
      // setTimeout(() => {
      //   this.authService.logout().subscribe(() => {
      //     this.authService.broadcastMessage('AFTER_LOGOUT_SUCCESS');
      //   });
      // }, 1000);
    }
    return error;
  }

  private checkConnection() {
    if (!window.navigator.onLine) {
      this.isOnline = false;
    }

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    if (!this.isOnline) {
      this.router.navigate(['no-internet']);
    }
  }

  public getApiParameter(url: string, queryObj: any) {
    let q = '';
    if (Object.keys(queryObj).length) {
      Object.keys(queryObj).forEach((v, k) => {
        if (k === 0) {
          q = `?${v}=${queryObj[v]}`;
        } else {
          q = q + `&${v}=${queryObj[v]}`;
        }
      });
    }
    return url + q;
  }

  public replaceApiValue(url: string, queryObj: any) {
    if (Object.keys(queryObj).length) {
      for (const v of Object.entries(queryObj) as any) {
        url = url.replace(v[0], v[1]);
      }
    }
    return url;
  }

  private getDateInUrl(url: any) {
    const re = new RegExp('([?&]' + name + '=)[^&]+', '');
    const add = (sep: any) => {
      url += sep + '-' + '=' + encodeURIComponent(new Date().getTime());
    };
    const change = () => {
      url = url.replace(re, '$1' + encodeURIComponent(new Date().getTime()));
    };
    if (url.indexOf('?') === -1) {
      add('?');
    } else {
      if (re.test(url)) {
        change();
      } else {
        add('&');
      }
    }
    return url;
  }

  public unsubscribeHttp(subscriptions: any) {
    for (const key in subscriptions) {
      if (key && subscriptions[key].unsubscribe) {
        subscriptions[key].unsubscribe();
      }
    }
  }
}
