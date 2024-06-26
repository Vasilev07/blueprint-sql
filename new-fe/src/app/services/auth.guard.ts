import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: "root",
})
export class AuthGuard implements CanActivate {
    constructor(
        private readonly authService: AuthService,
        private readonly router: Router,
    ) {}

    canActivate(): boolean {
        if (!this.authService.isLoggedIn()) {
            this.router.navigate(["/login"]);
            return false;
        }
        return true;
    }
}