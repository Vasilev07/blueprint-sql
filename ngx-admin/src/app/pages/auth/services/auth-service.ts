import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { NbAuthService, NbTokenService } from "@nebular/auth";

@Injectable({
    providedIn: 'root'
  })
  export class AuthGuard {

    constructor(private authService: NbAuthService, private router: Router, private tokenService: NbTokenService) {}
  
    canActivate(): boolean {
      return this.checkAuth();
    }
  
    canActivateChild(): boolean {
      return this.checkAuth();
    }

    private checkAuth(): boolean {
      if (this.authService.isAuthenticated()) {
        console.log('isATUh', this.authService.isAuthenticated());
        
        console.log('this.authService.getToken()', this.authService.getToken());
        this.tokenService.get().subscribe(token => console.log(token))
        
        return true;
      } else {
        // Redirect to the login page if the user is not authenticated
        this.router.navigate(['/auth/login']);
        return false;
      }
    }
  
  }