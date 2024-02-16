import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { NbTokenService } from "@nebular/auth";
import { AuthService } from "./auth-service";

@Injectable({
    providedIn: 'root'
  })
  export class AuthGuard {

    constructor(private authService: AuthService, private router: Router, private tokenService: NbTokenService) {}
  
    canActivate(): boolean {
      return this.checkAuth();
    }
  
    canActivateChild(): boolean {
      return this.checkAuth();
    }

    private checkAuth(): boolean {
      if (this.authService.isAuthenticated) {
        return true;
      } else {
        // Redirect to the login page if the user is not authenticated
        this.router.navigate(['/auth/login']);
        return false;
      }
    }
  
  }