import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { AppUrl } from '../config/app-url.enum';
import { AppConstant } from '../config/app-constant';
import * as settings from '../../../assets/settings.json';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  baseUrl: String = (<any>settings).baseUrl; // AppConstant.apiUrl;
  private subject = new Subject<any>();


  constructor(private http: HttpClient) { }

  setHeader(header) {
    const token = localStorage.getItem('sparksapi-access-token');
    const headers = new HttpHeaders({
      'X-Auth-Token': token,
      'Request-Platform': 'WEB',
      header
    });
    return headers;
  }

  getContactData(filters?: any): Observable<any> {
    return this.http.post(`${this.baseUrl}${AppUrl.userList}`, filters);
  }

  getEmailList(filters?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}${AppUrl.emailList}`);
  }

  getContactImage(params: any): Observable<any> {
    return this.http.post(`${this.baseUrl}${AppUrl.userImage}`, params);
  }

  getFilters(): Observable<any> {
    return this.http.get(`${this.baseUrl}${AppUrl.filters}`);
  }

  uploadFile(formData): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json'
    });
    headers.append('Content-Type', 'multipart/form-data');
    headers.append('Accept', 'application/json');
    return this.http.post(`${this.baseUrl}${AppUrl.upload}`, formData, {headers: headers});
  }

  sendMessage(object: any) {
    this.subject.next(object);
  }

  clearMessage() {
    this.subject.next();
  }

  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }

  saveDogInfo(params): Observable<any> {
    return this.http.post(`${this.baseUrl}${AppUrl.saveDog}`, params);
  }

  updateDogInfo(params): Observable<any> {
    return this.http.put(`${this.baseUrl}${AppUrl.updateDog}`, params);
  }

  deleteDog(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}${AppUrl.deleteDog}?id=${id}`);
  }
}
