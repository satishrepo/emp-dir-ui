import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

	constructor(private router: Router) {}
	
	canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
			console.log('----------------------------------');
			console.log(localStorage.getItem('sparksapi-access-token') , localStorage.getItem('sparks-logged-user'))
			if (localStorage.getItem('sparksapi-access-token') && localStorage.getItem('sparks-logged-user')) {
				return true;
			} else {
			  this.router.navigate(['login'], { queryParams: { returnUrl: state.url } });
				return false;
			}
  }

}
