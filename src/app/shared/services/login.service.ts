import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// import 'rxjs/add/operator/catch';
import { map } from "rxjs/operators";
import { AppUrl } from '../config/app-url.enum';
import { AppConstant } from '../config/app-constant';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/internal/operators/tap';
// import { catchError } from 'rxjs/internal/operators/catchError';
import * as settings from '../../../assets/settings.json';


@Injectable({
  providedIn: 'root'
})
export class LoginService {

  baseUrl: String = (<any>settings).baseUrl; //AppConstant.apiUrl;

  constructor(private http: HttpClient) { }

  public login(params): Observable<any> {
    return this.http.post(`${this.baseUrl}${AppUrl.login}`, params);
  }

  getLoggedInUser(): Observable<any> {
    return this.http.get(`${this.baseUrl}${AppUrl.loggedUser}`);
  }

  handleError(error: any) {
    if (error instanceof Response) {
      return Observable.throw(error.json()['error'] || 'backend server error');
    }
  }
}
