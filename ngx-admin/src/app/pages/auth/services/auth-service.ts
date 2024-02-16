import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { NbAuthJWTToken, NbTokenService } from "@nebular/auth";

@Injectable({
    providedIn: 'root'
  })
  export class AuthService {
    constructor(private tokenService: NbTokenService, private router: Router) {}

    isAuthenticated: boolean = false;

    login(res: NbAuthJWTToken) {
        this.tokenService.set(new NbAuthJWTToken(res['token'], 'email'));
        this.isAuthenticated = true;
        this.router.navigate(['/pages/dashboard']);
    }

    logout() {
        this.tokenService.clear();
        this.isAuthenticated = false;
        this.router.navigate(['/auth/login']);
    }
    
  }