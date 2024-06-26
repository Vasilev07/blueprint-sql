import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import moment from "moment";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Router } from "@angular/router";

@Injectable({ providedIn: "root" })
export class AuthService {
    constructor(
        private readonly http: HttpClient,
        private jwtHelper: JwtHelperService,
        private rourer: Router,
    ) {}

    login(): void {
        this.http
            .post("http://localhost:3000/auth/login", {
                username: "admin",
                password: "admin",
            })
            .subscribe((res) => {
                this.setSession(res);
                this.rourer.navigate(["/"]);
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

    private setSession(authResult: any) {
        localStorage.setItem("id_token", authResult.token);
    }
}
