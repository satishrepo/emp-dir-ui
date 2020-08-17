// import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Platform } from '@ionic/angular';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { map } from "rxjs/operators";
import { AppConstant } from 'src/app/shared/config/app-constant';

// @Injectable()
export class HeaderInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clone the request to add the new header
  const authCode = localStorage.getItem(AppConstant.accessTokenLabel) === null ? "" : localStorage.getItem(AppConstant.accessTokenLabel);
  const plateform = new Platform();

  const clonedRequest = req.clone({ headers: new HttpHeaders({
    // 'Content-Type':  'application/json',
    // 'x-api-key': 'xKsMYR75eJ639coUnrrng9Ie4Akrvs5I6sHEdmVb',
    'x-api-key': 'd41d8cd98f00b204e9800998ecf8427e',
    'X-Auth-Token': authCode,
    'Request-Platform' : plateform.is('cordova') ? 'APP' : 'WEB',
    })
  });

  // Pass the cloned request instead of the original request to the next handle
  return next.handle(clonedRequest).pipe(
    map((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse) {
        // console.log('event--->>>', event);
        // event.headers.set("X-Auth-Token", event.headers.get("Refresh-Token") !== null ? event.headers.get("Refresh-Token") : event.headers.get("Access-Token"));
        localStorage.setItem('sparksapi-access-token', event.headers.get("Refresh-Token") !== null ? event.headers.get("Refresh-Token") : event.headers.get("Access-Token"));
      }
      return event;
    }));
  }
}
