import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import moment from "moment";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Router } from "@angular/router";
import { UserService, UserDTO } from "src/typescript-api-client/src";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class AuthService {
    constructor(
        private readonly http: HttpClient,
        private jwtHelper: JwtHelperService,
        private router: Router,
        private userService: UserService
    ) { }

    login(email: string, password: string): void {
        this.userService.login({
            email,
            password
        }).subscribe((res) => {
                this.setSession(res);
                this.router.navigate(["/"]);
            });
    }

    register(userDTO: UserDTO): Observable<any> {
        return this.userService.register(userDTO);
    }

    checkEmailExists(email: string): Observable<boolean> {
        return new Observable(observer => {
            this.userService.checkEmail(email).subscribe(
                (response) => {
                    // Return true if email EXISTS (i.e., NOT available)
                    observer.next(!response.available);
                    observer.complete();
                },
                (error) => {
                    observer.error(error);
                }
            );
        });
    }

    logout() {
        localStorage.removeItem("id_token");
    }

    isLoggedIn() {
        return moment().isBefore(this.getExpiration());
    }

    getExpiration() {
        const token = localStorage.getItem("id_token") || "";
        const expiration: Date | null =
            this.jwtHelper.getTokenExpirationDate(token);
        return moment(expiration);
    }

    getUserEmail(): string {
        const token = localStorage.getItem("id_token");
        if (token) {
            const decodedToken = this.jwtHelper.decodeToken(token);
            return decodedToken.email;
        }
        return '';
    }

    getUserId(): number | null {
        const token = localStorage.getItem("id_token");
        if (token) {
            const decodedToken = this.jwtHelper.decodeToken(token);
            return decodedToken.id;
        }
        return null;
    }

    isAdmin(): boolean {
        const token = localStorage.getItem("id_token");
        console.log('🔍 AuthService: Checking admin status');
        console.log('🔍 AuthService: Token exists:', !!token);
        
        if (token && !this.jwtHelper.isTokenExpired(token)) {
            try {
                const decodedToken = this.jwtHelper.decodeToken(token);
                console.log('🔍 AuthService: Full decoded token:', JSON.stringify(decodedToken, null, 2));
                console.log('🔍 AuthService: User roles:', decodedToken.roles);
                console.log('🔍 AuthService: User roles type:', typeof decodedToken.roles);
                console.log('🔍 AuthService: User roles is array:', Array.isArray(decodedToken.roles));
                
                // Handle both array format ["user", "admin"] and object format {admin}
                let isAdmin = false;
                if (Array.isArray(decodedToken.roles)) {
                    isAdmin = decodedToken.roles.includes('admin');
                } else if (typeof decodedToken.roles === 'object' && decodedToken.roles !== null) {
                    isAdmin = decodedToken.roles.hasOwnProperty('admin') || decodedToken.roles.admin === true;
                }
                
                console.log('🔍 AuthService: Is admin result:', isAdmin);
                return isAdmin;
            } catch (error) {
                console.error('🔍 AuthService: Error decoding token for admin check:', error);
                return false;
            }
        }
        console.log('🔍 AuthService: No valid token, returning false');
        return false;
    }

    private setSession(authResult: any) {
        localStorage.setItem("id_token", authResult.token);
    }
}
