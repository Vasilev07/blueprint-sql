import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NbAuthJWTToken, NbTokenService } from '@nebular/auth';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    constructor(private tokenService: NbTokenService, private router: Router) {
        this.tokenService.tokenChange().subscribe((token: NbAuthJWTToken) => {
            token.isValid() ?
                this.isAuthenticated = true :
                this.isAuthenticated = false;
        });
    }

    isAuthenticated: boolean = false;

    login(res: NbAuthJWTToken) {
        this.tokenService.set(new NbAuthJWTToken(res['token'], 'email'));
        this.isAuthenticated = true;
        this.router.navigate(['/pages/dashboard']);
    }

    getToken() {
        return this.tokenService.get();
    }

    logout() {
        this.tokenService.clear();
        this.isAuthenticated = false;
        this.router.navigate(['/auth/login']);
    }
}
