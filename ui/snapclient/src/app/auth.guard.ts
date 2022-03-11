import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {AuthService} from './_services/auth.service';

@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authenticationService: AuthService,
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const auth = this.authenticationService.isAuthenticated();
    if (auth !== undefined && auth) {
      // Check if authorized
      if (!this.authenticationService.isLoading() && !this.authenticationService.isAuthorized(route)) {
        return this.router.parseUrl('/notauthorized');
      }
      return auth;      // logged in so return true
    }

    // not logged in so redirect to login page with the return url
    this.router.navigate(['/'], {queryParams: {returnUrl: state.url}});
    return false;
  }
}
